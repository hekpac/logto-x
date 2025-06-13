# Tenant Usage Refactor

**File paths**
- `packages/core/src/libraries/quota.ts`
- `packages/core/src/queries/tenant-usage/index.ts`
- `packages/core/src/tenants/Libraries.ts`
- `packages/core/src/tenants/Queries.ts`
- `packages/core/src/test-utils/quota.ts`

**Key changes**
- Injected the shared `Queries` object into `QuotaLibrary` instead of creating a `TenantUsageQuery` with `CommonQueryMethods`.
- Updated `TenantUsageQuery` methods to accept a tenant id parameter and return tenant specific data.
- Updated usages across tenant libraries and tests to use the new query interface.
- Removed direct dependency on `CommonQueryMethods` from `QuotaLibrary`.

**New dependencies / environment variables**
- None.
