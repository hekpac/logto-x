/* eslint-disable max-lines, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, no-restricted-syntax */

import { z } from 'zod';

import {
  samlApplicationSignInCallbackQueryParametersGuard,
  type SamlApplicationCallbackQuery,
  createCallbackValidation,
  createCallbackSessionHandler,
  createCallbackResponder,
} from './utils.js';
import {
  createMetadataHandler,
  createRedirectBindingHandler,
  createPostBindingHandler,
} from './handlers.js';
import koaAuditLog from '#src/middleware/koa-audit-log.js';
import koaGuard from '#src/middleware/koa-guard.js';
import type { AnonymousRouter, RouterInitArgs } from '#src/routes/types.js';

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
    createMetadataHandler(getSamlApplicationDetailsById, envSet)
  );

  router.get(
    '/saml-applications/:id/callback',
    koaGuard({
      params: z.object({ id: z.string() }),
      query: samlApplicationSignInCallbackQueryParametersGuard,
      status: [200, 400, 404],
    }),
    koaAuditLog(queries),
    createCallbackValidation(getSamlApplicationDetailsById, envSet),
    createCallbackSessionHandler(queries.samlApplicationSessions),
    createCallbackResponder(queries.samlApplicationSessions)
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
    createRedirectBindingHandler(getSamlApplicationDetailsById, insertSession, envSet)
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
    createPostBindingHandler(getSamlApplicationDetailsById, insertSession, envSet)
  );
}
/* eslint-enable max-lines, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, no-restricted-syntax */
