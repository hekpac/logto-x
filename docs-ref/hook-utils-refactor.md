# Hook Utils Refactor

**File paths**
- `packages/core/src/libraries/hook/utils.ts`
- `packages/core/src/libraries/hook/context-manager.ts`
- `packages/core/src/libraries/hook/utils.test.ts`

**Key changes**
- Replaced separate key builder and event check utilities with `resolveManagementApiDataHookEvent`.
- Updated `DataHookContextManager` to use the new helper when determining registered events.
- Added unit tests covering the helper for registered and unregistered routes.
- Simplified helper signatures:
  - `sendWebhookRequest` now accepts `(config, payload, signingKey)`.
  - `generateHookTestPayload` accepts an object with `hookId` and `event`.
  - `resolveManagementApiDataHookEvent` takes the router context instead of method and route.
  - Added tests verifying the new payload generator.

**New dependencies / environment variables**
- None.
