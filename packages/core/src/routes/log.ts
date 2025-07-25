import { Logs, interaction, token, LogKeyUnknown, jwtCustomizer, saml } from '@logto/schemas';
import { object, string } from 'zod';

import koaGuard from '#src/middleware/koa-guard.js';
import koaPagination from '#src/middleware/koa-pagination.js';
import { type AllowedKeyPrefix } from '#src/queries/log.js';
import { fetchLogsWithPagination } from './utils/log.js';

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
      const includeKeyPrefix: AllowedKeyPrefix[] = [
        token.Type.ExchangeTokenBy,
        token.Type.RevokeToken,
        interaction.prefix,
        jwtCustomizer.prefix,
        saml.prefix,
        LogKeyUnknown,
      ];

      const { count, logs } = await fetchLogsWithPagination(
        { countLogs, findLogs },
        { limit, offset },
        ctx.request.URL.searchParams,
        { includeKeyPrefix }
      );

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
