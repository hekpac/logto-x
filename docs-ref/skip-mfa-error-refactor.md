# Skip MFA Hook Refactor

**File paths**
- `packages/experience/src/hooks/use-skip-mfa.ts`
- `packages/experience/src/hooks/use-skip-mfa-error-handler.ts`
- `packages/experience/src/hooks/__tests__/use-skip-mfa.test.ts`

**Key changes**
- Introduced `useSkipMfaErrorHandler` to resolve the interaction event from the current location and supply the correct error handlers.
- Updated `useSkipMfa` to leverage the new helper for clearer error processing.
- Added unit tests covering sign-in and registration flows.

**New dependencies / environment variables**
- None.
