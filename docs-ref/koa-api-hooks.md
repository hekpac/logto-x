# API Hooks Middleware

**File paths**
- `packages/core/src/middleware/koa-api-hooks.ts`
- `packages/core/src/routes/init.ts`
- `packages/core/src/routes/account/index.ts`
- `packages/core/src/middleware/koa-api-hooks.test.ts`

**Key changes**
- Documented that `koaApiHooks` is shared across Management and user Account APIs.
- Management API routes rely on `managementApiHooksRegistration` to append events automatically.
- User Account routes append contexts manually with `ctx.appendDataHookContext`.
- Updated comments and tests to reflect the behavior.

**New dependencies / environment variables**
- None.
