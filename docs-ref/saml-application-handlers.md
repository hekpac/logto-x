# SAML Application Handlers Refactor

**File paths**
- `packages/core/src/routes/saml-application/handlers.ts`
- `packages/core/src/routes/saml-application/anonymous.ts`
- `packages/core/src/routes/saml-application/handlers.test.ts`

**Key changes**
- Extracted metadata, redirect binding, and post binding logic into dedicated middleware.
- Updated the anonymous routes to use these new handlers.
- Added unit tests for the handlers using mocked `SamlApplication` instances.

**New dependencies / environment variables**
- None.
