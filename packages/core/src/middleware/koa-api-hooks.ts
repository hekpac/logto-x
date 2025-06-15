import { trySafe } from '@silverhand/essentials';
import { type MiddlewareType } from 'koa';
import { type IRouterParamContext } from 'koa-router';

import { DataHookContextManager } from '#src/libraries/hook/context-manager.js';
import type Libraries from '#src/tenants/Libraries.js';
import { getConsoleLogFromContext } from '#src/utils/console.js';

export type WithHookContext<ContextT extends IRouterParamContext = IRouterParamContext> =
  ContextT & { appendDataHookContext: DataHookContextManager['appendContext'] };

/**
 * Factory for the API hook middleware.
 *
 * Used by both the Management API and the user Account API. The middleware
 * collects contexts for DataHook events. User routes manually append contexts
 * while Management API routes may register events that are appended
 * automatically.
 *
 * To trigger hooks, call `ctx.appendDataHookContext` in a route handler.
 *
 * @see ../../../../docs-ref/koa-api-hooks.md
 *
 * @param hooks The hooks library.
 * @returns The middleware function.
 */
export const koaApiHooks = <StateT, ContextT extends IRouterParamContext, ResponseT>(
  hooks: Libraries['hooks']
): MiddlewareType<StateT, WithHookContext<ContextT>, ResponseT> => {
  return async (ctx, next) => {
    const {
      header: { 'user-agent': userAgent },
      ip,
    } = ctx;

    const dataHooksContextManager = new DataHookContextManager({ userAgent, ip });

    /**
     * Append a hook context to trigger data hooks. If multiple contexts are
     * appended, all of them will be triggered.
     */
    ctx.appendDataHookContext = dataHooksContextManager.appendContext.bind(dataHooksContextManager);

    await next();

    // Auto append pre-registered management API hooks if any. Only management
    // API routes are registered for automatic triggering.
    const registeredData = dataHooksContextManager.getRegisteredDataHookEventContext(ctx);

    if (registeredData) {
      dataHooksContextManager.appendContext(...registeredData);
    }

    // Trigger data hooks
    if (dataHooksContextManager.contextArray.length > 0) {
      // Hooks should not crash the app
      void trySafe(hooks.triggerDataHooks(getConsoleLogFromContext(ctx), dataHooksContextManager));
    }
  };
};
