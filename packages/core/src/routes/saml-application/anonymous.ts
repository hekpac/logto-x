/* eslint-disable max-lines, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, no-restricted-syntax */
import { authRequestInfoGuard } from '@logto/schemas';
import { removeUndefinedKeys } from '@silverhand/essentials';
import { z } from 'zod';

import {
  verifyAndGetSamlSessionData,
  samlApplicationSignInCallbackQueryParametersGuard,
  validateSamlCallbackQuery,
  resetSamlSessionState,
  createSamlAppSession,
  type SamlApplicationCallbackQuery,
} from './utils.js';
import RequestError, { isRequestError } from '#src/errors/RequestError/index.js';
import koaAuditLog from '#src/middleware/koa-audit-log.js';
import koaGuard from '#src/middleware/koa-guard.js';
import type { AnonymousRouter, RouterInitArgs } from '#src/routes/types.js';
import { SamlApplication } from '#src/saml-application/SamlApplication/index.js';
import { generateAutoSubmitForm } from '#src/saml-application/SamlApplication/utils.js';
import assertThat from '#src/utils/assert-that.js';
import { getConsoleLogFromContext } from '#src/utils/console.js';

export default function samlApplicationAnonymousRoutes<T extends AnonymousRouter>(
  ...[router, { queries, envSet }]: RouterInitArgs<T>
) {
  const {
    samlApplications: { getSamlApplicationDetailsById },
    samlApplicationSessions: {
      insertSession,
      findSessionById,
      removeSessionOidcStateById,
      deleteExpiredSessions,
    },
  } = queries;

  router.get(
    '/saml-applications/:id/metadata',
    koaGuard({
      params: z.object({ id: z.string() }),
      status: [200, 400, 404],
      response: z.string(),
    }),
    async (ctx, next) => {
      const { id } = ctx.guard.params;

      const details = await getSamlApplicationDetailsById(id);
      const samlApplication = new SamlApplication(details, id, envSet);

      ctx.status = 200;
      ctx.body = samlApplication.idPMetadata;
      ctx.type = 'text/xml;charset=utf-8';

      return next();
    }
  );

  router.get(
    '/saml-applications/:id/callback',
    koaGuard({
      params: z.object({ id: z.string() }),
      query: samlApplicationSignInCallbackQueryParametersGuard,
      status: [200, 400, 404],
    }),
    koaAuditLog(queries),
    // eslint-disable-next-line complexity
    async (ctx, next) => {
      const consoleLog = getConsoleLogFromContext(ctx);
      // eslint-disable-next-line no-restricted-syntax
      const {
        params: { id },
        query,
      } = ctx.guard as {
        params: { id: string };
        query: SamlApplicationCallbackQuery;
      };

      /**
       * When generating swagger.json, we build path/query guards and verify whether the query/path guard is an instance of ZodObject. Previously, our query guard was a Union of Zod Objects, which failed the validation. Now, we directly use ZodObject guards and perform additional validations within the API.
       */
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
        'oidc.invalid_redirect_uri'
      );

      const { code, state, redirectUri } = query;

      if (redirectUri) {
        assertThat(redirectUri === samlApplication.samlAppCallbackUrl, 'oidc.invalid_redirect_uri');
      }

      const { relayState, samlRequestId, sessionId, sessionExpiresAt } =
        await verifyAndGetSamlSessionData(ctx, queries.samlApplicationSessions, state);
      log.append({
        session: {
          relayState,
          samlRequestId,
          sessionId,
          sessionExpiresAt,
        },
      });

      // Handle OIDC callback and get user info
      const userInfo = await samlApplication.handleOidcCallbackAndGetUserInfo({
        code,
      });
      log.append({
        userInfo,
      });

      const { context, entityEndpoint } = await samlApplication.createSamlResponse({
        userInfo,
        relayState,
        samlRequestId,
        sessionId,
        sessionExpiresAt,
      });

      log.append({
        context,
        entityEndpoint,
      });

      // Return auto-submit form
      ctx.body = generateAutoSubmitForm(entityEndpoint, context);

      await resetSamlSessionState(ctx, queries.samlApplicationSessions, consoleLog, state);

      return next();
    }
  );

  // Redirect binding SAML authentication request endpoint
  router.get(
    '/saml/:id/authn',
    koaGuard({
      params: z.object({ id: z.string() }),
      query: z
        .object({
          SAMLRequest: z.string().min(1),
          Signature: z.string().optional(),
          SigAlg: z.string().optional(),
          RelayState: z.string().optional(),
        })
        .catchall(z.string()),
      status: [200, 302, 400, 404],
    }),
    koaAuditLog(queries),
    async (ctx, next) => {
      const {
        params: { id },
        query: { Signature, RelayState, ...rest },
      } = ctx.guard;

      const log = ctx.createLog('SamlApplication.AuthnRequest');
      log.append({
        query: ctx.guard.query,
        applicationId: id,
      });

      const details = await getSamlApplicationDetailsById(id);
      const samlApplication = new SamlApplication(details, id, envSet);

      const octetString = Object.keys(ctx.request.query)
        // eslint-disable-next-line no-restricted-syntax
        .map((key) => key + '=' + encodeURIComponent(ctx.request.query[key] as string))
        .join('&');
      const { SAMLRequest, SigAlg } = rest;

      // Parse login request
      try {
        const loginRequestResult = await samlApplication.parseLoginRequest('redirect', {
          query: removeUndefinedKeys({
            SAMLRequest,
            Signature,
            SigAlg,
          }),
          octetString,
        });

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
          'application.saml.auth_request_issuer_not_match'
        );

        const { session, oidcState } = await createSamlAppSession(ctx, insertSession, {
          applicationId: id,
          relayState: RelayState,
          samlRequestId: extractResult.data.request.id,
          rawAuthRequest: SAMLRequest,
          longState: true,
          longSessionId: true,
        });

        log.append({
          cookie: {
            spInitiatedSamlSsoSessionCookieName: session,
          },
        });

        const signInUrl = await samlApplication.getSignInUrl({ state: oidcState });

        ctx.redirect(signInUrl.toString());
      } catch (error: unknown) {
        if (isRequestError(error)) {
          throw error;
        }

        throw new RequestError({
          code: 'application.saml.invalid_saml_request',
        });
      }

      return next();
    }
  );

  // Post binding SAML authentication request endpoint
  router.post(
    '/saml/:id/authn',
    koaGuard({
      params: z.object({ id: z.string() }),
      body: z.object({
        SAMLRequest: z.string().min(1),
        RelayState: z.string().optional(),
      }),
      status: [200, 302, 400, 404],
    }),
    koaAuditLog(queries),
    async (ctx, next) => {
      const {
        params: { id },
        body: { SAMLRequest, RelayState },
      } = ctx.guard;

      const log = ctx.createLog('SamlApplication.AuthnRequest');
      log.append({
        body: ctx.guard.body,
        applicationId: id,
      });

      const details = await getSamlApplicationDetailsById(id);
      const samlApplication = new SamlApplication(details, id, envSet);

      // Parse login request
      try {
        const loginRequestResult = await samlApplication.parseLoginRequest('post', {
          body: {
            SAMLRequest,
          },
        });

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
          'application.saml.auth_request_issuer_not_match'
        );

        const { session, oidcState } = await createSamlAppSession(ctx, insertSession, {
          applicationId: id,
          relayState: RelayState,
          samlRequestId: extractResult.data.request.id,
          rawAuthRequest: SAMLRequest,
        });

        log.append({
          cookie: {
            spInitiatedSamlSsoSessionCookieName: session,
          },
        });

        const signInUrl = await samlApplication.getSignInUrl({ state: oidcState });

        ctx.redirect(signInUrl.toString());
      } catch (error: unknown) {
        if (isRequestError(error)) {
          throw error;
        }

        throw new RequestError({
          code: 'application.saml.invalid_saml_request',
        });
      }

      return next();
    }
  );
}
/* eslint-enable max-lines, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, no-restricted-syntax */
