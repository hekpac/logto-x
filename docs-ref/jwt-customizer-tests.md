# JWT Customizer Test Scenarios

**File paths**
- `packages/integration-tests/src/__mocks__/jwt-customizer.ts`
- `packages/integration-tests/src/tests/api/logto-config.test.ts`
- `packages/integration-tests/src/tests/api/oidc/get-access-token.test.ts`
- `packages/console/src/__tests__/jwt-customizer-path.test.ts`

**Key changes**
- Added scripts for syntax errors and non-object returns to mock utilities.
- Covered failure cases when the customizer script has invalid syntax or returns a non-object.
- Verified environment variable claims are included in access tokens.
- Added unit tests for `getApiPath` and `getPagePath` helpers in the console.

**New dependencies / environment variables**
- None.
