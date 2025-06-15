# Resource Scope Lookup Refactor

**File paths**
- `packages/core/src/oidc/resource.ts`
- `packages/core/src/oidc/resource.test.ts`

**Key changes**
- Extracted `findReservedResourceScopes`, `findOrganizationResourceScopes`, and `findDefaultResourceScopes` from `findResourceScopes`.
- Added tests covering user priority over application scopes and the organization scenario.

**New dependencies / environment variables**
- None.
