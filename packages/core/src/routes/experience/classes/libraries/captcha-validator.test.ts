/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import { CaptchaType } from '@logto/schemas';
import ky, { type KyResponse } from 'ky';

// @ts-expect-error -- jest from import.meta
const { jest } = import.meta;

const envBackup = process.env;
const log = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  append() {},
};

const makeResponse = (score: number): KyResponse =>
  ({
    json: async () => ({
      tokenProperties: { valid: true },
      riskAnalysis: { score },
    }),
  }) as unknown as KyResponse;

const post = jest
  .spyOn(ky, 'post')
  // @ts-expect-error -- ky typings do not match jest mock
  .mockResolvedValue(makeResponse(0));

beforeEach(() => {
  process.env = { ...envBackup };
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetModules();
});

describe('CaptchaValidator threshold', () => {
  const baseProvider = {
    id: 'id',
    tenantId: 'tenant',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    config: {
      type: CaptchaType.RecaptchaEnterprise,
      siteKey: 'key',
      secretKey: 'secret',
      projectId: 'project',
    },
  } as const;

  it('uses default threshold from env', async () => {
    process.env.CAPTCHA_SCORE_THRESHOLD = '0.6';
    jest.resetModules();
    const { CaptchaValidator } = await import('./captcha-validator.js');

    post.mockResolvedValueOnce(makeResponse(0.65));

    const validator = new CaptchaValidator({ ...baseProvider }, log);
    await expect(validator.verifyCaptcha('token')).resolves.toBe(true);
  });

  it('fails when score below env threshold', async () => {
    process.env.CAPTCHA_SCORE_THRESHOLD = '0.9';
    jest.resetModules();
    const { CaptchaValidator } = await import('./captcha-validator.js');

    post.mockResolvedValueOnce(makeResponse(0.85));

    const validator = new CaptchaValidator({ ...baseProvider }, log);
    await expect(validator.verifyCaptcha('token')).resolves.toBe(false);
  });

  it('provider config overrides env', async () => {
    process.env.CAPTCHA_SCORE_THRESHOLD = '0.9';
    jest.resetModules();
    const { CaptchaValidator } = await import('./captcha-validator.js');

    post.mockResolvedValueOnce(makeResponse(0.81));

    const validator = new CaptchaValidator(
      {
        ...baseProvider,
        config: { ...baseProvider.config, scoreThreshold: 0.8 },
      },
      log
    );
    await expect(validator.verifyCaptcha('token')).resolves.toBe(true);
  });
});

/* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
