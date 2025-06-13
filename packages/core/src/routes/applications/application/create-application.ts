import { Applications, ApplicationType, hasSecrets } from '@logto/schemas';
import { generateStandardId, generateStandardSecret } from '@logto/shared';
import { conditional } from '@silverhand/essentials';
import { object, z } from 'zod';

import RequestError from '#src/errors/RequestError/index.js';
import koaGuard from '#src/middleware/koa-guard.js';
import { buildOidcClientMetadata } from '#src/oidc/utils.js';
import assertThat from '#src/utils/assert-that.js';

import type { ManagementApiRouter, RouterInitArgs } from '../types.js';
import { applicationCreateGuard } from '../types.js';
import { generateInternalSecret } from './application-secret.js';

export default function createApplication<T extends ManagementApiRouter>(
  ...[router, tenant]: RouterInitArgs<T>
) {
  const {
    queries,
    libraries: { quota, protectedApps },
  } = tenant;

  router.post(
    '/applications',
    koaGuard({
      body: applicationCreateGuard,
      response: Applications.guard,
      status: [200, 400, 422, 500],
    }),
    // eslint-disable-next-line complexity
    async (ctx, next) => {
      const { oidcClientMetadata, protectedAppMetadata, ...rest } = ctx.guard.body;

      if (rest.type === ApplicationType.SAML) {
        throw new RequestError('application.saml.use_saml_app_api');
      }

      await Promise.all([
        rest.type === ApplicationType.MachineToMachine &&
          quota.guardTenantUsageByKey('machineToMachineLimit'),
        rest.isThirdParty && quota.guardTenantUsageByKey('thirdPartyApplicationsLimit'),
        quota.guardTenantUsageByKey('applicationsLimit'),
      ]);

      assertThat(
        rest.type !== ApplicationType.Protected || protectedAppMetadata,
        'application.protected_app_metadata_is_required'
      );

      if (rest.isThirdParty) {
        assertThat(
          rest.type === ApplicationType.Traditional,
          'application.invalid_third_party_application_type'
        );
      }

      const application = await queries.applications.insertApplication({
        id: generateStandardId(),
        secret: generateInternalSecret(),
        oidcClientMetadata: buildOidcClientMetadata(oidcClientMetadata),
        ...conditional(
          rest.type === ApplicationType.Protected &&
            protectedAppMetadata &&
            (await protectedApps.buildProtectedAppData(protectedAppMetadata))
        ),
        ...rest,
      });

      if (hasSecrets(application.type)) {
        await queries.applicationSecrets.insert({
          name: 'Default secret',
          applicationId: application.id,
          value: generateStandardSecret(),
        });
      }

      if (application.type === ApplicationType.Protected) {
        try {
          await protectedApps.syncAppConfigsToRemote(application.id);
        } catch (error: unknown) {
          // Delete the application if failed to sync to remote
          await queries.applications.deleteApplicationById(application.id);
          throw error;
        }
      }

      ctx.body = application;

      if (rest.type === ApplicationType.MachineToMachine) {
        void quota.reportSubscriptionUpdatesUsage('machineToMachineLimit');
      }

      return next();
    }
  );
}
