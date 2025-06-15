# WebAuthn Option Generators

**File paths**
- `packages/core/src/utils/webauthn-shared.ts`
- `packages/core/src/routes/interaction/utils/webauthn.ts`
- `packages/core/src/routes/interaction/additional.ts`
- `packages/core/src/routes/interaction/additional.test.ts`
- `packages/core/src/routes/experience/classes/verifications/web-authn-verification.ts`

**Key changes**
- Introduced a dedicated `webauthn-shared.ts` util with `generateRegistrationOptions` and `generateAuthenticationOptions` helpers.
- Updated existing routes and tests to import these helpers instead of local implementations.
- Simplified `webauthn.ts` by delegating option generation logic to the new util.

**New dependencies / environment variables**
- None.
