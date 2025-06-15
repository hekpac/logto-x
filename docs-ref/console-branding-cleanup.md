# Console SSO Branding Cleanup

**File paths**
- `packages/console/src/pages/EnterpriseSsoDetails/Experience/index.tsx`
- `packages/integration-tests/src/tests/console/sso-branding-cleanup.test.ts`

**Key changes**
- Remove empty branding values before submitting SSO connector updates.
- Added integration test ensuring PATCH requests omit empty branding fields.

**New dependencies / environment variables**
- None.
