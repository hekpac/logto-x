import type { ManagementApiRouter, RouterInitArgs } from '../types.js';

import applicationCustomDataRoutes from './application-custom-data.js';
import createApplication from './application/create-application.js';
import deleteApplication from './application/delete-application.js';
import getApplication from './application/get-application.js';
import getApplications from './application/get-applications.js';
import updateApplication from './application/update-application.js';
import applicationOrganizationRoutes from './application-organization.js';
import applicationProtectedAppMetadataRoutes from './application-protected-app-metadata.js';
import applicationRoleRoutes from './application-role.js';
import applicationSecretRoutes from './application-secret.js';
import applicationSignInExperienceRoutes from './application-sign-in-experience.js';
import applicationUserConsentOrganizationRoutes from './application-user-consent-organization.js';
import applicationUserConsentScopeRoutes from './application-user-consent-scope.js';

export default function applicationRoutes<T extends ManagementApiRouter>(
  ...[router, tenant]: RouterInitArgs<T>
) {
  getApplications(router, tenant);
  createApplication(router, tenant);
  getApplication(router, tenant);
  updateApplication(router, tenant);
  deleteApplication(router, tenant);

  applicationCustomDataRoutes(router, tenant);
  applicationRoleRoutes(router, tenant);
  applicationProtectedAppMetadataRoutes(router, tenant);
  applicationOrganizationRoutes(router, tenant);
  applicationSecretRoutes(router, tenant);
  applicationUserConsentScopeRoutes(router, tenant);
  applicationSignInExperienceRoutes(router, tenant);
  applicationUserConsentOrganizationRoutes(router, tenant);
}
