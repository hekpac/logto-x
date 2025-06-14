import { ConnectorError, ConnectorErrorCodes, TemplateType } from '@logto/connector-kit';
import nock from 'nock';

import { endpoint } from './constant.js';
import createConnector from './index.js';
import { mockedConfig } from './mock.js';

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

  it('throws TemplateNotFound if template missing', async () => {
    const connector = await createConnector({ getConfig });
    await expect(
      connector.sendMessage({
        to: '+1234567890',
        type: TemplateType.SignIn,
        payload: { code: '1234' },
      })
    ).rejects.toStrictEqual(
      new ConnectorError(
        ConnectorErrorCodes.TemplateNotFound,
        'Cannot find template for type: SignIn'
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
    const url = new URL(endpoint);
    nock(url.origin).post(url.pathname).reply(400, { message: 'error' });
    const connector = await createConnector({ getConfig });
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
  });
});
