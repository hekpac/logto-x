import { cond, trySafe, type Nullable } from '@silverhand/essentials';
import { addMinutes } from 'date-fns';
import { type Context } from 'koa';
import type { Middleware } from 'koa';
import { z } from 'zod';

import { spInitiatedSamlSsoSessionCookieName } from '#src/constants/index.js';
import type Queries from '#src/tenants/Queries.js';
import assertThat from '#src/utils/assert-that.js';
import RequestError from '#src/errors/RequestError/index.js';
import type { ConsoleLog } from '#src/utils/console.js';
import { getConsoleLogFromContext } from '#src/utils/console.js';
import { SamlApplication } from '#src/saml-application/SamlApplication/index.js';
import { generateAutoSubmitForm } from '#src/saml-application/SamlApplication/utils.js';
import { EnvSet } from '#src/env-set/index.js';
import { generateStandardId, generateStandardShortId } from '@logto/shared';

export const verifyAndGetSamlSessionData = async (
  ctx: Context,
  queries: Queries['samlApplicationSessions'],
  state?: string
): Promise<{
  relayState: Nullable<string>;
  samlRequestId: Nullable<string>;
  sessionId?: string;
  sessionExpiresAt?: string;
}> => {
  if (!state) {
    return {
      relayState: null,
      samlRequestId: null,
    };
  }

  const sessionId = ctx.cookies.get(spInitiatedSamlSsoSessionCookieName);
  assertThat(sessionId, 'application.saml.sp_initiated_saml_sso_session_not_found_in_cookies');
  const session = await queries.findSessionById(sessionId);
  assertThat(session, 'application.saml.sp_initiated_saml_sso_session_not_found');

  const { relayState, samlRequestId } = session;
  const sessionExpiresAt = new Date(session.expiresAt).toISOString();

  assertThat(session.oidcState === state, 'application.saml.state_mismatch');

  return {
    relayState,
    samlRequestId,
    sessionId,
    sessionExpiresAt,
  };
};

export const samlApplicationSignInCallbackQueryParametersGuard = z
  .object({
    code: z.string(),
    state: z.string(),
    redirectUri: z.string(),
    error: z.string(),
    error_description: z.string(),
  })
  .partial();

export type SamlApplicationCallbackQuery = z.infer<
  typeof samlApplicationSignInCallbackQueryParametersGuard
>;

export const validateSamlCallbackQuery = (
  query: SamlApplicationCallbackQuery
) => {
  if (!query.code && !query.error) {
    throw new RequestError({
      code: 'guard.invalid_input',
      message: 'Either code or error must be present',
      type: 'query',
    });
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (query.code && (query.error || query.error_description)) {
    throw new RequestError({
      code: 'guard.invalid_input',
      type: 'query',
      message: 'Cannot have both code and error fields',
    });
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (query.error && (query.code || query.state || query.redirectUri)) {
    throw new RequestError({
      code: 'guard.invalid_input',
      type: 'query',
      message: 'When error is present, only error_description is allowed',
    });
  }

  if (query.error) {
    throw new RequestError({
      code: 'oidc.invalid_request',
      message: query.error_description,
      type: 'query',
    });
  }

  assertThat(
    query.code,
    new RequestError({
      code: 'guard.invalid_input',
      type: 'query',
      message: '`code` is required.',
    })
  );
};

export const resetSamlSessionState = async (
  ctx: Context,
  queries: Queries['samlApplicationSessions'],
  consoleLog: ConsoleLog,
  state?: string
) => {
  if (!state) {
    return;
  }

  const sessionId = ctx.cookies.get(spInitiatedSamlSsoSessionCookieName);

  if (sessionId) {
    await trySafe(
      async () => queries.removeSessionOidcStateById(sessionId),
      (error) => {
        consoleLog.warn(
          'error encountered while resetting OIDC `state`',
          JSON.stringify(error)
        );
      }
    );

    ctx.cookies.set(spInitiatedSamlSsoSessionCookieName, '', {
      httpOnly: true,
      expires: new Date(0),
    });
  }

  await trySafe(
    async () => queries.deleteExpiredSessions(),
    (error) => {
      consoleLog.warn(
        'error encountered while deleting expired sessions',
        JSON.stringify(error)
      );
    }
  );
};

export const createSamlAppSession = async (
  ctx: Context,
  insertSession: Queries['samlApplicationSessions']['insertSession'],
  {
    applicationId,
    relayState,
    samlRequestId,
    rawAuthRequest,
    longState,
    longSessionId,
  }: {
    applicationId: string;
    relayState?: string;
    samlRequestId: string;
    rawAuthRequest: string;
    longState?: boolean;
    longSessionId?: boolean;
  }
) => {
  const oidcState = longState ? generateStandardId(32) : generateStandardShortId();
  const expiresAt = addMinutes(new Date(), 60);
  const session = await insertSession({
    id: longSessionId ? generateStandardId(32) : generateStandardId(),
    applicationId,
    oidcState,
    samlRequestId,
    rawAuthRequest,
    expiresAt: expiresAt.getTime(),
    ...cond(relayState && { relayState }),
  });

  ctx.cookies.set(spInitiatedSamlSsoSessionCookieName, session.id, {
    httpOnly: true,
    sameSite: 'strict',
    expires: expiresAt,
    overwrite: true,
  });

  return { session, oidcState, expiresAt } as const;
};

export const createCallbackValidation = (
  getSamlApplicationDetailsById: Queries['samlApplications']['getSamlApplicationDetailsById'],
  envSet: EnvSet,
): Middleware =>
  async (ctx, next) => {
    const {
      params: { id },
      query,
    } = ctx.guard as { params: { id: string }; query: SamlApplicationCallbackQuery };

    validateSamlCallbackQuery(query);

    const log = ctx.createLog('SamlApplication.Callback');

    log.append({
      query,
      applicationId: id,
    });

    const details = await getSamlApplicationDetailsById(id);
    const samlApplication = new SamlApplication(details, id, envSet);

    assertThat(
      samlApplication.config.redirectUri === samlApplication.samlAppCallbackUrl,
      'oidc.invalid_redirect_uri',
    );

    if (query.redirectUri) {
      assertThat(query.redirectUri === samlApplication.samlAppCallbackUrl, 'oidc.invalid_redirect_uri');
    }

    ctx.state.samlApplication = samlApplication;
    ctx.state.callbackLog = log;

    return next();
  };

export const createCallbackSessionHandler = (
  queries: Queries['samlApplicationSessions'],
): Middleware =>
  async (ctx, next) => {
    const { code, state } = ctx.guard.query as SamlApplicationCallbackQuery;
    const samlApplication = ctx.state.samlApplication as SamlApplication;
    const log = ctx.state.callbackLog as ReturnType<typeof ctx.createLog>;

    const { relayState, samlRequestId, sessionId, sessionExpiresAt } =
      await verifyAndGetSamlSessionData(ctx, queries, state);
    log.append({
      session: { relayState, samlRequestId, sessionId, sessionExpiresAt },
    });

    const userInfo = await samlApplication.handleOidcCallbackAndGetUserInfo({ code });
    log.append({ userInfo });

    const { context, entityEndpoint } = await samlApplication.createSamlResponse({
      userInfo,
      relayState,
      samlRequestId,
      sessionId,
      sessionExpiresAt,
    });

    log.append({ context, entityEndpoint });

    ctx.state.samlResponse = { context, entityEndpoint, state };

    return next();
  };

export const createCallbackResponder = (
  queries: Queries['samlApplicationSessions'],
): Middleware =>
  async (ctx, next) => {
    const { context, entityEndpoint, state } = ctx.state.samlResponse as {
      context: string;
      entityEndpoint: string;
      state?: string;
    };

    ctx.body = generateAutoSubmitForm(entityEndpoint, context);

    await resetSamlSessionState(ctx, queries, getConsoleLogFromContext(ctx), state);

    return next();
  };
