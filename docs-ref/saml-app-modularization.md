# SAML Application Modularization

**File paths**
- `packages/console/src/saml-application/SamlApplication/attribute-utils.ts`
- `packages/console/src/saml-application/SamlApplication/config.ts`
- `packages/console/src/saml-application/SamlApplication/index.ts`

**Key changes**
- Split attribute mapping logic into `attribute-utils.ts`.
- Extracted application configuration to `config.ts`.
- Simplified `index.ts` by delegating to these new modules.

**New dependencies / environment variables**
- None.
