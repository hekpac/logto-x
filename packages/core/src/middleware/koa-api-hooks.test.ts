import { managementApiHooksRegistration } from '@logto/schemas';
import { ConsoleLog } from '@logto/shared';
import { type ParameterizedContext } from 'koa';

import type Libraries from '#src/tenants/Libraries.js';
import { createContextWithRouteParameters } from '#src/utils/test-utils.js';

import { koaApiHooks, type WithHookContext } from './koa-api-hooks.js';

const { jest } = import.meta;

const notToBeCalled = () => {
  throw new Error('Should not be called');
};

describe('koaApiHooks', () => {
  const next = jest.fn();
  const triggerDataHooks = jest.fn();
  // @ts-expect-error mock
  const mockHooksLibrary: Libraries['hooks'] = {
    triggerDataHooks,
  };

  it("should do nothing if there's no hook context", async () => {
    const ctx = {
      ...createContextWithRouteParameters(),
      header: {},
      appendDataHookContext: notToBeCalled,
    };
    await koaApiHooks(mockHooksLibrary)(ctx, next);
    expect(triggerDataHooks).not.toBeCalled();
  });

  // Covers usage on user APIs where the context is appended manually
  it('should trigger data hooks when context is appended', async () => {
    const ctx: ParameterizedContext<unknown, WithHookContext> = {
      ...createContextWithRouteParameters(),
      header: {},
      appendDataHookContext: notToBeCalled,
    };
    next.mockImplementation(() => {
      ctx.appendDataHookContext('Role.Created', { data: { id: '123' } });
    });

    await koaApiHooks(mockHooksLibrary)(ctx, next);
    expect(triggerDataHooks).toBeCalledTimes(1);
    expect(triggerDataHooks).toBeCalledWith(
      expect.any(ConsoleLog),
      expect.objectContaining({
        metadata: { userAgent: ctx.header['user-agent'], ip: ctx.ip },
        contextArray: [
          {
            event: 'Role.Created',
            data: { id: '123' },
          },
        ],
      })
    );
  });

  it('should trigger data hooks for multiple contexts', async () => {
    const ctx: ParameterizedContext<unknown, WithHookContext> = {
      ...createContextWithRouteParameters(),
      header: {},
      appendDataHookContext: notToBeCalled,
    };

    next.mockImplementation(() => {
      ctx.appendDataHookContext('Role.Created', { data: { id: '1' } });
      ctx.appendDataHookContext('Role.Data.Updated', { data: { id: '1' } });
    });

    await koaApiHooks(mockHooksLibrary)(ctx, next);

    expect(triggerDataHooks).toBeCalledTimes(1);
    expect(triggerDataHooks).toBeCalledWith(
      expect.any(ConsoleLog),
      expect.objectContaining({
        contextArray: [
          { event: 'Role.Created', data: { id: '1' } },
          { event: 'Role.Data.Updated', data: { id: '1' } },
        ],
      })
    );
  });

  describe('auto append pre-registered management API hooks', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const events = Object.entries(managementApiHooksRegistration);

    it.each(events)('should append hook context for %s', async (key, event) => {
      const [method, route] = key.split(' ') as [string, string];
      const ctxParams = createContextWithRouteParameters();

      const ctx: ParameterizedContext<unknown, WithHookContext> = {
        ...ctxParams,
        header: {},
        appendDataHookContext: notToBeCalled,
        method,
        _matchedRoute: route,
        path: route,
        response: {
          ...ctxParams.response,
          body: { key },
        },
        status: 200,
      };

      await koaApiHooks(mockHooksLibrary)(ctx, next);

      expect(triggerDataHooks).toBeCalledWith(
        expect.any(ConsoleLog),
        expect.objectContaining({
          contextArray: [
            {
              event,
              data: { key },
              path: route,
              method,
              params: ctxParams.params,
              matchedRoute: route,
              status: 200,
            },
          ],
        })
      );
    });
  });

  it('should not trigger hooks for unregistered management route', async () => {
    const ctx: ParameterizedContext<unknown, WithHookContext> = {
      ...createContextWithRouteParameters(),
      header: {},
      appendDataHookContext: notToBeCalled,
      method: 'GET',
      _matchedRoute: '/unregistered',
      path: '/unregistered',
      response: { body: {} },
      status: 200,
    } as any;

    await koaApiHooks(mockHooksLibrary)(ctx, next);

    expect(triggerDataHooks).not.toBeCalled();
  });
});
