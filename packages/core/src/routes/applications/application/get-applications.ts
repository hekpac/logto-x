import type { ManagementApiRouter, RouterInitArgs } from '../types.js';
import { Applications } from '@logto/schemas';
import RequestError from '#src/errors/RequestError/index.js';
import koaGuard from '#src/middleware/koa-guard.js';
import koaPagination from '#src/middleware/koa-pagination.js';
import { parseSearchParamsForSearch } from '#src/utils/search.js';
import { object, string, z } from 'zod';

import {
  applicationTypeGuard,
  hideOidcClientMetadataForSamlApps,
  parseIsThirdPartQueryParam,
} from './utils.js';

export default function getApplications<T extends ManagementApiRouter>(
  ...[router, tenant]: RouterInitArgs<T>
) {
  const { queries } = tenant;

  router.get(
    '/applications',
    koaPagination({ isOptional: true }),
    koaGuard({
      query: object({
        /**
         * We treat the `types` query param as an array, but it will be parsed as string-typed
         * value if only one type is specified, manually convert to ApplicationType array.
         */
        types: applicationTypeGuard
          .array()
          .or(applicationTypeGuard.transform((type) => [type]))
          .optional(),
        excludeRoleId: string().optional(),
        excludeOrganizationId: string().optional(),
        isThirdParty: z.union([z.literal('true'), z.literal('false')]).optional(),
      }),
      response: z.array(Applications.guard),
      status: 200,
    }),
    async (ctx, next) => {
      const { limit, offset, disabled: paginationDisabled } = ctx.pagination;
      const { searchParams } = ctx.URL;
      const {
        types,
        excludeRoleId,
        excludeOrganizationId,
        isThirdParty: isThirdPartyParam,
      } = ctx.guard.query;

      if (excludeRoleId && excludeOrganizationId) {
        throw new RequestError({
          code: 'request.invalid_input',
          status: 400,
          details:
            'Parameter `excludeRoleId` and `excludeOrganizationId` cannot be used at the same time.',
        });
      }

      const isThirdParty = parseIsThirdPartQueryParam(isThirdPartyParam);

      // This will only parse the `search` query param, other params will be ignored. Please use query guard to validate them.
      const search = parseSearchParamsForSearch(searchParams);

      const excludeApplicationsRoles = excludeRoleId
        ? await queries.applicationsRoles.findApplicationsRolesByRoleId(excludeRoleId)
        : [];

      const excludeApplicationIds = excludeApplicationsRoles.map(
        ({ applicationId }) => applicationId
      );

      if (paginationDisabled) {
        const rawApplications = await queries.applications.findApplications({
          search,
          excludeApplicationIds,
          excludeOrganizationId,
          types,
          isThirdParty,
        });
        ctx.body = hideOidcClientMetadataForSamlApps(rawApplications);

        return next();
      }

      const [{ count }, applications] = await Promise.all([
        queries.applications.countApplications({
          search,
          excludeApplicationIds,
          excludeOrganizationId,
          isThirdParty,
          types,
        }),
        queries.applications.findApplications(
          {
            search,
            excludeApplicationIds,
            excludeOrganizationId,
            types,
            isThirdParty,
          },
          { limit, offset }
        ),
      ]);

      // Return totalCount to pagination middleware
      ctx.pagination.totalCount = count;
      ctx.body = hideOidcClientMetadataForSamlApps(applications);

      return next();
    }
  );
}
