
import { EnvSet } from '#src/env-set/index.js';

export class TenantNotFoundError extends Error {}

/**
 * This function returns the MongoDB connection string for the tenant.
 *
 * **CAUTION** ** In multi-tenancy mode, Logto should ALWAYS use a dedicated connection to ensure data isolation between tenants.
 */
export const getTenantDatabaseDsn = async (_tenantId: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { dbUrl } = EnvSet;

  if (!dbUrl) {
    throw new Error('MONGODB_URI is not configured');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return dbUrl;
};
