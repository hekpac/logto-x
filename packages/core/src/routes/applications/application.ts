import type { ManagementApiRouter, RouterInitArgs } from '../types.js';

import applicationCustomDataRoutes from './application-custom-data.js';
import createApplication from './application/create-application.js';
import deleteApplication from './application/delete-application.js';
import getApplication from './application/get-application.js';
import getApplications from './application/get-applications.js';
import updateApplication from './application/update-application.js';

export default function applicationRoutes<T extends ManagementApiRouter>(
  ...[router, tenant]: RouterInitArgs<T>
) {
  getApplications(router, tenant);
  createApplication(router, tenant);
  getApplication(router, tenant);
  updateApplication(router, tenant);
  deleteApplication(router, tenant);

  applicationCustomDataRoutes(router, tenant);
}
