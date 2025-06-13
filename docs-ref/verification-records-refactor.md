# Verification Records Refactor

**File paths**
- `packages/core/src/routes/experience/classes/verifications/*`
- `packages/core/src/routes/experience/types.ts`
- `packages/schemas/src/types/verification-records/*`

**Key changes**
- Moved all verification record type definitions to `@logto/schemas` so they can be shared across packages.
- Updated verification classes to import these types from `@logto/schemas` and removed their local `zod` schema definitions.
- Added new type files under `packages/schemas/src/types/verification-records` and adjusted exports.

**New dependencies / environment variables**
- None.
