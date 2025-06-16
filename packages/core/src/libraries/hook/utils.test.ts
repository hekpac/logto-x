import {
  type HookEvent,
  InteractionHookEvent,
  managementApiHooksRegistration,
} from '@logto/schemas';
import { createMockUtils } from '@logto/shared/esm';
import ky from 'ky';

const { jest } = import.meta;

const { mockEsm, mockEsmWithActual } = createMockUtils(jest);

const post = jest
  .spyOn(ky, 'post')
  // @ts-expect-error
  .mockImplementation(jest.fn(async () => ({ statusCode: 200, body: '{"message":"ok"}' })));

const mockSignature = 'mockSignature';
mockEsm('#src/utils/sign.js', () => ({
  sign: () => mockSignature,
}));

const {
  generateHookTestPayload,
  sendWebhookRequest,
  resolveManagementApiDataHookEvent,
} = await import('./utils.js');

describe('sendWebhookRequest', () => {
  it('should call got.post with correct values', async () => {
    const mockHookId = 'mockHookId';
    const mockEvent: HookEvent = InteractionHookEvent.PostSignIn;
    const testPayload = generateHookTestPayload({ hookId: mockHookId, event: mockEvent });

    const mockUrl = 'https://logto.gg';
    const mockSigningKey = 'mockSigningKey';

    await sendWebhookRequest(
      {
        url: mockUrl,
        headers: { foo: 'bar' },
      },
      testPayload,
      mockSigningKey
    );

    expect(post).toBeCalledWith(mockUrl, {
      headers: {
        'user-agent': 'Logto (https://logto.io/)',
        foo: 'bar',
        'logto-signature-sha-256': mockSignature,
      },
      json: testPayload,
      retry: { limit: 3 },
      timeout: 10_000,
    });
  });
});

describe('generateHookTestPayload', () => {
  it('should generate interaction hook payload for interaction event', () => {
    const payload = generateHookTestPayload({
      hookId: 'id',
      event: InteractionHookEvent.PostSignIn,
    });

    expect(payload).toMatchObject({
      hookId: 'id',
      event: InteractionHookEvent.PostSignIn,
      sessionId: 'fake-session-id',
      userId: 'fake-id',
      application: { id: 'fake-spa-application-id' },
    });
  });

  it('should generate data hook payload for data event', () => {
    const payload = generateHookTestPayload({ hookId: 'id', event: 'Role.Created' });

    expect(payload).toMatchObject({
      hookId: 'id',
      event: 'Role.Created',
      path: '/fake-path/:id',
    });
  });
});

describe('resolveManagementApiDataHookEvent', () => {
  it('should return event for registered route', () => {
    const [key, event] = Object.entries(managementApiHooksRegistration)[0];
    const [method, route] = key.split(' ') as [string, string];

    expect(
      resolveManagementApiDataHookEvent({ method, _matchedRoute: route })
    ).toBe(event);
  });

  it('should return undefined for unregistered route', () => {
    expect(
      resolveManagementApiDataHookEvent({ method: 'GET', _matchedRoute: '/unregistered' })
    ).toBeUndefined();
  });
});
