import { Logs, interaction, token, LogKeyUnknown, jwtCustomizer, saml } from '@logto/schemas';
import { object, string } from 'zod';

import koaGuard from '#src/middleware/koa-guard.js';
import koaPagination from '#src/middleware/koa-pagination.js';
import { type AllowedKeyPrefix } from '#src/queries/log.js';
 <<<<<<< fqaw4b-codex/consolidar-parámetros-de-búsqueda-y-paginación
import { fetchLogsWithPagination } from './utils/log.js';
=======
import { parseLogSearchParams } from '#src/utils/log.js';
 >>>>>>> master

import type { ManagementApiRouter, RouterInitArgs } from './types.js';

export default function logRoutes<T extends ManagementApiRouter>(
  ...[router, { queries }]: RouterInitArgs<T>
) {
  const { findLogById, countLogs, findLogs } = queries.logs;

  router.get(
    '/logs',
    koaPagination(),
    koaGuard({ response: Logs.guard.omit({ tenantId: true }).array(), status: 200 }),
    async (ctx, next) => {
      const { limit, offset } = ctx.pagination;
 <<<<<<< fqaw4b-codex/consolidar-parámetros-de-búsqueda-y-paginación
=======
      const { userId, applicationId, logKey } = parseLogSearchParams(ctx.request.URL.searchParams);

 >>>>>>> master
      const includeKeyPrefix: AllowedKeyPrefix[] = [
        token.Type.ExchangeTokenBy,
        token.Type.RevokeToken,
        interaction.prefix,
        jwtCustomizer.prefix,
        saml.prefix,
        LogKeyUnknown,
      ];

 <<<<<<< fqaw4b-codex/consolidar-parámetros-de-búsqueda-y-paginación
      const { count, logs } = await fetchLogsWithPagination(
        { countLogs, findLogs },
        { limit, offset },
        ctx.request.URL.searchParams,
        { includeKeyPrefix }
      );
=======
      const [{ count }, logs] = await Promise.all([
        countLogs({
          logKey,
          payload: { applicationId, userId },
          includeKeyPrefix,
        }),
        findLogs(limit, offset, {
          logKey,
          payload: { userId, applicationId },
          includeKeyPrefix,
        }),
      ]);
 >>>>>>> master

      ctx.pagination.totalCount = count;
      ctx.body = logs;

      return next();
    }
  );

  router.get(
    '/logs/:id',
    koaGuard({ params: object({ id: string().min(1) }), response: Logs.guard, status: [200, 404] }),
    async (ctx, next) => {
      const {
        params: { id },
      } = ctx.guard;

      ctx.body = await findLogById(id);

      return next();
    }
  );
}
