# Organization Invitation Error Messages

**File paths**
- `packages/phrases/src/locales/*/errors/organization-invitation.ts`
- `packages/core/src/routes/organization-invitation/index.ts`
- `packages/core/src/libraries/organization-invitation.ts`
- `packages/integration-tests/src/tests/api/organization/organization-invitation.*.test.ts`

**Key changes**
- Added `accepted_user_id_required` and `expires_at_future_required` error codes.
- Routes and library now throw localized `RequestError`s using these codes.
- Updated integration tests to expect the new localized codes.

**New dependencies / environment variables**
- None.
