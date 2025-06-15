# Hook Utils Refactor

**File paths**
- `packages/core/src/libraries/hook/utils.ts`
- `packages/core/src/libraries/hook/context-manager.ts`
- `packages/core/src/libraries/hook/utils.test.ts`

**Key changes**
- Replaced separate key builder and event check utilities with `resolveManagementApiDataHookEvent`.
- Updated `DataHookContextManager` to use the new helper when determining registered events.
- Added unit tests covering the helper for registered and unregistered routes.

**New dependencies / environment variables**
- None.
