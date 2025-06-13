import { Applications, buildDemoAppDataForTenant, demoAppApplicationId } from '@logto/schemas';
import { object, string, z } from 'zod';

import koaGuard from '#src/middleware/koa-guard.js';

import type { ManagementApiRouter, RouterInitArgs } from '../types.js';
import { hideOidcClientMetadataForSamlApp, includesInternalAdminRole } from './utils.js';

export default function getApplication<T extends ManagementApiRouter>(
  ...[router, tenant]: RouterInitArgs<T>
) {
  const {
    queries,
    id: tenantId,
  } = tenant;

  router.get(
    '/applications/:id',
    koaGuard({
      params: object({ id: string().min(1) }),
      response: Applications.guard.merge(z.object({ isAdmin: z.boolean() })),
      status: [200, 404],
    }),
    async (ctx, next) => {
      const {
        params: { id },
      } = ctx.guard;

      // Somethings console needs to display demo app info. Build a fixed one for it.
      if (id === demoAppApplicationId) {
        ctx.body = { ...buildDemoAppDataForTenant(tenantId), isAdmin: false };

        return next();
      }

      const application = await queries.applications.findApplicationById(id);
      const applicationsRoles =
        await queries.applicationsRoles.findApplicationsRolesByApplicationId(id);

      ctx.body = {
        ...hideOidcClientMetadataForSamlApp(application),
        isAdmin: includesInternalAdminRole(applicationsRoles),
      };

      return next();
    }
  );
}
