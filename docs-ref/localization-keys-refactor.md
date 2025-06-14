# Localization Keys Refactor

**File paths**
- `packages/console/src/hooks/use-api.ts`
- `packages/core/src/queries/application.ts`

**Key changes**
- Replaced hard-coded English strings with localization keys returned from the API.
- Introduced `RequestError` with code `entity.not_exists_with_id` when an application is missing.
- Updated global request error handler to check `data.code` and status before redirecting.

**New dependencies / environment variables**
- None.
