import { authRequestInfoGuard } from '@logto/schemas';
import { removeUndefinedKeys } from '@silverhand/essentials';
import type { Middleware } from 'koa';

import { SamlApplication } from '#src/saml-application/SamlApplication/index.js';
import assertThat from '#src/utils/assert-that.js';
import RequestError, { isRequestError } from '#src/errors/RequestError/index.js';
import type Queries from '#src/tenants/Queries.js';
import { EnvSet } from '#src/env-set/index.js';

import {
  createSamlAppSession,
  type SamlApplicationCallbackQuery,
} from './utils.js';

const parseAndValidateRequest = async (
  samlApplication: SamlApplication,
  binding: 'redirect' | 'post',
  options: Record<string, unknown>,
  samlRequest: string,
  relayState: string | undefined,
  ctx: Parameters<Middleware>[0],
  insertSession: Queries['samlApplicationSessions']['insertSession'],
  applicationId: string,
  log: { append: (data: Record<string, unknown>) => void },
  longSession?: boolean,
) => {
  const loginRequestResult = await samlApplication.parseLoginRequest(binding, options);
  log.append({ loginRequestResult });
  const extractResult = authRequestInfoGuard.safeParse(loginRequestResult.extract);
  log.append({ extractResult });

  if (!extractResult.success) {
    throw new RequestError({
      code: 'application.saml.invalid_saml_request',
      error: extractResult.error.flatten(),
    });
  }

  log.append({ extractResultData: extractResult.data });

  assertThat(
    extractResult.data.issuer === samlApplication.config.spEntityId,
    'application.saml.auth_request_issuer_not_match',
  );

  const { session, oidcState } = await createSamlAppSession(ctx, insertSession, {
    applicationId,
    relayState,
    samlRequestId: extractResult.data.request.id,
    rawAuthRequest: samlRequest,
    longState: longSession,
    longSessionId: longSession,
  });

  log.append({
    cookie: {
      spInitiatedSamlSsoSessionCookieName: session,
    },
  });

  const signInUrl = await samlApplication.getSignInUrl({ state: oidcState });
  ctx.redirect(signInUrl.toString());
};

export const createMetadataHandler = (
  getSamlApplicationDetailsById: Queries['samlApplications']['getSamlApplicationDetailsById'],
  envSet: EnvSet,
): Middleware =>
  async (ctx, next) => {
    const { id } = ctx.guard.params as { id: string };

    const details = await getSamlApplicationDetailsById(id);
    const samlApplication = new SamlApplication(details, id, envSet);

    ctx.status = 200;
    ctx.body = samlApplication.idPMetadata;
    ctx.type = 'text/xml;charset=utf-8';

    return next();
  };

export const createRedirectBindingHandler = (
  getSamlApplicationDetailsById: Queries['samlApplications']['getSamlApplicationDetailsById'],
  insertSession: Queries['samlApplicationSessions']['insertSession'],
  envSet: EnvSet,
): Middleware =>
  async (ctx, next) => {
    const {
      params: { id },
      query: { Signature, RelayState, ...rest },
    } = ctx.guard as { params: { id: string }; query: SamlApplicationCallbackQuery };

    const samlApplication = new SamlApplication(await getSamlApplicationDetailsById(id), id, envSet);
    const log = ctx.createLog('SamlApplication.AuthnRequest');
    log.append({ query: ctx.guard.query, applicationId: id });

    const octetString = Object.keys(ctx.request.query)
      .map((key) => key + '=' + encodeURIComponent(ctx.request.query[key] as string))
      .join('&');
    const { SAMLRequest, SigAlg } = rest as Record<string, string>;

    try {
      await parseAndValidateRequest(
        samlApplication,
        'redirect',
        {
          query: removeUndefinedKeys({ SAMLRequest, Signature, SigAlg }),
          octetString,
        },
        SAMLRequest,
        RelayState as string | undefined,
        ctx,
        insertSession,
        id,
        log,
        true,
      );
    } catch (error: unknown) {
      if (isRequestError(error)) {
        throw error;
      }

      throw new RequestError({ code: 'application.saml.invalid_saml_request' });
    }

    return next();
  };

export const createPostBindingHandler = (
  getSamlApplicationDetailsById: Queries['samlApplications']['getSamlApplicationDetailsById'],
  insertSession: Queries['samlApplicationSessions']['insertSession'],
  envSet: EnvSet,
): Middleware =>
  async (ctx, next) => {
    const {
      params: { id },
      body: { SAMLRequest, RelayState },
    } = ctx.guard as { params: { id: string }; body: { SAMLRequest: string; RelayState?: string } };

    const samlApplication = new SamlApplication(await getSamlApplicationDetailsById(id), id, envSet);
    const log = ctx.createLog('SamlApplication.AuthnRequest');
    log.append({ body: ctx.guard.body, applicationId: id });

    try {
      await parseAndValidateRequest(
        samlApplication,
        'post',
        { body: { SAMLRequest } },
        SAMLRequest,
        RelayState,
        ctx,
        insertSession,
        id,
        log,
      );
    } catch (error: unknown) {
      if (isRequestError(error)) {
        throw error;
      }

      throw new RequestError({ code: 'application.saml.invalid_saml_request' });
    }

    return next();
  };

