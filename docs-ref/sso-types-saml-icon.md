# SSO Types and SAML App Icon

**File paths**
- `packages/schemas/src/types/oidc.ts`
- `packages/schemas/src/types/saml.ts`
- `packages/console/src/assets/icons/saml-app.svg`
- `packages/console/src/assets/icons/saml-app-dark.svg`
- Various console pages updated to import SSO types from `@logto/schemas`

**Key changes**
- Moved OpenID Connect and SAML type definitions to the `@logto/schemas` package for reuse.
- Added new light and dark SAML application icons and referenced them in the UI.

**New dependencies / environment variables**
- None.
