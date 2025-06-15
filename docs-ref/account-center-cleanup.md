# Account Center Cleanup

**File paths**
- `packages/core/src/middleware/koa-auth/koa-oidc-auth.ts`
- `packages/core/src/middleware/koa-auth/types.ts`
- `packages/core/src/routes/account/*`
- `packages/integration-tests/src/api/my-account.ts`
- `packages/integration-tests/src/tests/api/account/*`

**Key changes**
- Removed the temporary `verificationRecordId` header logic from `koa-oidc-auth`.
- Dropped `identityVerified` checks in account routes.
- Updated tests and helpers to reflect the new behavior.

**New dependencies / environment variables**
- None.
