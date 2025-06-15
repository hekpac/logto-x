import { ConnectorError, ConnectorErrorCodes, TemplateType } from '@logto/connector-kit';
import { got, HTTPError, type PlainResponse } from 'got';
import nock from 'nock';

import { endpoint } from './constant.js';
import createConnector from './index.js';
import { mockedConfig } from './mock.js';
import type { SmsAeroConfig } from './types.js';

const getConfig = vi.fn().mockResolvedValue(mockedConfig);

describe('SMSAero SMS connector', () => {
  afterEach(() => {
    nock.cleanAll();
    vi.clearAllMocks();
  });
  it('init without throwing errors', async () => {
    await expect(createConnector({ getConfig })).resolves.not.toThrow();
  });

  it('should send message successfully', async () => {
    const url = new URL(endpoint);
    const scope = nock(url.origin)
      .post(url.pathname, (body) => {
        expect(body).toMatchObject({
          number: '+1234567890',
          sign: mockedConfig.senderName,
          text: 'This is for testing purposes only. Your verification code is 1234.',
        });

        return true;
      })
      .reply(200, { message: 'ok' });

    const connector = await createConnector({ getConfig });
    await expect(
      connector.sendMessage({
        to: '+1234567890',
        type: TemplateType.Generic,
        payload: { code: '1234' },
      })
    ).resolves.not.toThrow();

    expect(scope.isDone()).toBe(true);
  });

  it('should send message successfully with input config', async () => {
    const url = new URL(endpoint);
    const scope = nock(url.origin).post(url.pathname).reply(200, { message: 'ok' });

    const connector = await createConnector({ getConfig });

    await expect(
      connector.sendMessage(
        {
          to: '+1234567890',
          type: TemplateType.Generic,
          payload: { code: '1234' },
        },
        mockedConfig
      )
    ).resolves.not.toThrow();

    expect(scope.isDone()).toBe(true);
  });

  it('throws TemplateNotFound if template missing', async () => {
    const connector = await createConnector({ getConfig });

    await expect(
      connector.sendMessage({
        to: '+1234567890',
        type: TemplateType.OrganizationInvitation,
        payload: { code: '1234' },
      })
    ).rejects.toStrictEqual(
      new ConnectorError(
        ConnectorErrorCodes.TemplateNotFound,
        'Cannot find template for type: OrganizationInvitation'
      )
    );
  });

  it('throws General error if service responds with error text', async () => {
    const url = new URL(endpoint);
    nock(url.origin).post(url.pathname).reply(400, 'error');
    const connector = await createConnector({ getConfig });
    await expect(
      connector.sendMessage({
        to: '+1234567890',
        type: TemplateType.Generic,
        payload: { code: '1234' },
      })
    ).rejects.toStrictEqual(new ConnectorError(ConnectorErrorCodes.General, 'error'));
  });

  it('throws InvalidResponse if service response is not string', async () => {
    const connector = await createConnector({ getConfig });

    const rawBody = { message: 'error' };
    const fakeResponse = {
      statusCode: 400,
      statusMessage: 'Bad Request',
      request: {
        _onResponse: () => {
          // Noop
        },
        options: {},
        response: { body: rawBody },
      },
    } as unknown as PlainResponse;

    vi.spyOn(got, 'post').mockRejectedValue(new HTTPError(fakeResponse));

    await expect(
      connector.sendMessage({
        to: '+1234567890',
        type: TemplateType.Generic,
        payload: { code: '1234' },
      })
    ).rejects.toStrictEqual(
      new ConnectorError(
        ConnectorErrorCodes.InvalidResponse,
        'Invalid response raw body type: object'
      )
    );

    vi.restoreAllMocks();
  });

  it('throws InvalidConfig when config is invalid', async () => {
    const connector = await createConnector({ getConfig });
    const invalidConfig: SmsAeroConfig = {
      email: 'invalid-email',
      apiKey: mockedConfig.apiKey,
      senderName: mockedConfig.senderName,
      templates: mockedConfig.templates,
    };

    await expect(
      connector.sendMessage(
        {
          to: '+1234567890',
          type: TemplateType.Generic,
          payload: { code: '1234' },
        },
        invalidConfig
      )
    ).rejects.toMatchObject({ code: ConnectorErrorCodes.InvalidConfig });
  });
});
