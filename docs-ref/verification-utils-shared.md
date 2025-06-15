# Social & WebAuthn Verification Utils

**File paths**
- `packages/core/src/routes/experience/utils/verification/social-verification.ts`
- `packages/core/src/routes/experience/utils/verification/webauthn.ts`
- `packages/core/src/routes/interaction/verifications/mfa-payload-verification.ts`
- `packages/core/src/routes/interaction/verifications/identifier-payload-verification.ts`
- `packages/core/src/routes/experience/classes/verifications/social-verification.ts`
- `packages/core/src/routes/experience/classes/verifications/web-authn-verification.ts`
- `packages/core/src/routes/interaction/utils/social-verification.test.ts`
- `packages/core/src/routes/interaction/utils/webauthn.test.ts`
- `packages/core/src/routes/interaction/verifications/mfa-payload-verification.test.ts`
- `packages/core/src/routes/interaction/verifications/identifier-payload-verification.test.ts`

**Key changes**
- Introduced `experience/utils/verification` directory to share verification helpers.
- Moved `verifySocialIdentity`, `assignConnectorSessionResult`, and
  `getConnectorSessionResult` into `social-verification.ts` within the new directory.
- Moved `verifyWebAuthnRegistration` and `verifyWebAuthnAuthentication` into
  `webauthn.ts` under the same directory.
- Updated imports and related tests to use the new paths.

**New dependencies / environment variables**
- None.
