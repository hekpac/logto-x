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

## Usage

`koaApiHooks` gathers context for DataHook events and triggers hooks after the
request cycle. Mount the middleware on both Management and user Account routers.

### Management API

```ts
const managementRouter = new Router();
managementRouter.use(koaApiHooks(tenant.libraries.hooks));
// Events defined in `managementApiHooksRegistration` will be appended
// automatically based on the route and HTTP method.
```

### Account API

```ts
const userRouter = new Router();
userRouter.use(koaApiHooks(tenant.libraries.hooks));

userRouter.patch('/account', async (ctx) => {
  // Update the user here
  ctx.appendDataHookContext('User.Data.Updated', { user: updatedUser });
});
```

The middleware triggers `hooks.triggerDataHooks` once all contexts are appended.
