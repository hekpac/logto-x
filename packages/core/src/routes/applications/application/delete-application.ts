import { ApplicationType } from '@logto/schemas';
import { object, string, z } from 'zod';

import RequestError from '#src/errors/RequestError/index.js';
import koaGuard from '#src/middleware/koa-guard.js';
import assertThat from '#src/utils/assert-that.js';

import type { ManagementApiRouter, RouterInitArgs } from '../types.js';

export default function deleteApplication<T extends ManagementApiRouter>(
  ...[router, tenant]: RouterInitArgs<T>
) {
  const {
    queries,
    libraries: { quota, protectedApps },
  } = tenant;

  router.delete(
    '/applications/:id',
    koaGuard({
      params: object({ id: string().min(1) }),
      response: z.undefined(),
      status: [204, 400, 404, 422],
    }),
    async (ctx, next) => {
      const { id } = ctx.guard.params;
      const { type, protectedAppMetadata } = await queries.applications.findApplicationById(id);

      if (type === ApplicationType.SAML) {
        throw new RequestError('application.saml.use_saml_app_api');
      }

      if (type === ApplicationType.Protected && protectedAppMetadata) {
        assertThat(
          !protectedAppMetadata.customDomains || protectedAppMetadata.customDomains.length === 0,
          'application.should_delete_custom_domains_first',
          422
        );
        await protectedApps.deleteRemoteAppConfigs(protectedAppMetadata.host);
      }
      // Note: will need delete cascade when application is joint with other tables
      await queries.applications.deleteApplicationById(id);
      ctx.status = 204;

      if (type === ApplicationType.MachineToMachine) {
        void quota.reportSubscriptionUpdatesUsage('machineToMachineLimit');
      }

      return next();
    }
  );
}
