# MultiOptionInput Refactor

**File paths**
- `packages/console/src/pages/EnterpriseSsoDetails/Experience/DomainsInput/index.tsx`
- `packages/console/src/pages/EnterpriseSsoDetails/Experience/DomainsInput/index.module.scss`
- `packages/console/src/components/TenantMembers/InviteEmailsInput/index.tsx`
- `packages/console/src/components/TenantMembers/InviteEmailsInput/index.module.scss`

**Key changes**
- Replaced bespoke domain and invite email inputs with the shared `MultiOptionInput` component.
- Removed legacy input handlers and styling.
- Simplified validation and error rendering via `MultiOptionInput` callbacks.

**New dependencies / environment variables**
- None.
