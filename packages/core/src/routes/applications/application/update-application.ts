import { Applications, ApplicationType, InternalRole } from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import { object, boolean, string, z } from 'zod';

import RequestError from '#src/errors/RequestError/index.js';
import koaGuard from '#src/middleware/koa-guard.js';
import assertThat from '#src/utils/assert-that.js';

import type { ManagementApiRouter, RouterInitArgs } from '../types.js';
import { applicationPatchGuard } from '../types.js';
import { includesInternalAdminRole } from './utils.js';

export default function updateApplication<T extends ManagementApiRouter>(
  ...[router, tenant]: RouterInitArgs<T>
) {
  const {
    queries,
    libraries: { protectedApps },
  } = tenant;

  router.patch(
    '/applications/:id',
    koaGuard({
      params: object({ id: string().min(1) }),
      body: applicationPatchGuard.merge(
        object({
          isAdmin: boolean().optional(),
        })
      ),
      response: Applications.guard,
      status: [200, 400, 404, 422, 500],
    }),
    async (ctx, next) => {
      const {
        params: { id },
        body,
      } = ctx.guard;

      const { isAdmin, protectedAppMetadata, ...rest } = body;

      const pendingUpdateApplication = await queries.applications.findApplicationById(id);
      if (pendingUpdateApplication.type === ApplicationType.SAML) {
        throw new RequestError('application.saml.use_saml_app_api');
      }

      // @deprecated
      // User can enable the admin access of Machine-to-Machine apps by switching on a toggle on Admin Console.
      // Since those apps sit in the user tenant, we provide an internal role to apply the necessary scopes.
      // This role is NOT intended for user assignment.
      if (isAdmin !== undefined) {
        const [applicationsRoles, internalAdminRole] = await Promise.all([
          queries.applicationsRoles.findApplicationsRolesByApplicationId(id),
          queries.roles.findRoleByRoleName(InternalRole.Admin),
        ]);
        const usedToBeAdmin = includesInternalAdminRole(applicationsRoles);

        assertThat(
          internalAdminRole,
          new RequestError({
            code: 'entity.not_exists',
            status: 500,
            data: { name: InternalRole.Admin },
          })
        );

        if (isAdmin && !usedToBeAdmin) {
          await queries.applicationsRoles.insertApplicationsRoles([
            { id: generateStandardId(), applicationId: id, roleId: internalAdminRole.id },
          ]);
        } else if (!isAdmin && usedToBeAdmin) {
          await queries.applicationsRoles.deleteApplicationRole(id, internalAdminRole.id);
        }
      }

      if (protectedAppMetadata) {
        const { type, protectedAppMetadata: originProtectedAppMetadata } = pendingUpdateApplication;
        assertThat(type === ApplicationType.Protected, 'application.protected_application_only');
        assertThat(
          originProtectedAppMetadata,
          new RequestError({
            code: 'application.protected_application_misconfigured',
            status: 422,
          })
        );
        await queries.applications.updateApplicationById(id, {
          protectedAppMetadata: {
            ...originProtectedAppMetadata,
            ...protectedAppMetadata,
          },
        });
        try {
          await protectedApps.syncAppConfigsToRemote(id);
        } catch (error: unknown) {
          // Revert changes on sync failure
          await queries.applications.updateApplicationById(id, {
            protectedAppMetadata: originProtectedAppMetadata,
          });
          throw error;
        }
      }

      ctx.body =
        Object.keys(rest).length > 0
          ? await queries.applications.updateApplicationById(id, rest, 'replace')
          : pendingUpdateApplication;

      return next();
    }
  );
}
