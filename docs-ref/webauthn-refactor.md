# WebAuthn Utils Refactor

**File paths**
- `packages/core/src/routes/interaction/utils/webauthn.ts`
- `packages/integration-tests/src/tests/api/account/mfa.test.ts`

**Key changes**
- Wrapped `verifyRegistrationResponse` in a `try/catch` block to surface errors as `RequestError` with code `session.mfa.webauthn_verification_failed` and status `400`.
- Updated integration test to expect the new error code and status instead of a generic 500 response.

**New dependencies / environment variables**
- None.
