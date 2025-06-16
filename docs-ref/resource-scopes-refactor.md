# Resource Scope Lookup Refactor

**File paths**
- `packages/core/src/oidc/resource.ts`
- `packages/core/src/oidc/resource.test.ts`

**Key changes**
- Consolidated subject lookup logic into `findSubjectResourceScopes` to remove duplication.
- Replaced the switch statement in `findReservedResourceScopes` with a mapping for easier extension.
- Added tests covering user priority over application scopes and the organization scenario.

**New dependencies / environment variables**
- None.
