import {
  type CaptchaProvider,
  CaptchaProviders,
  type CaptchaProviderKeys,
  type CreateCaptchaProvider,
} from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import { type CommonQueryMethods } from '@silverhand/slonik';

import SchemaQueries from '../utils/SchemaQueries.js';
import RequestError from '#src/errors/RequestError/index.js';

export class CaptchaProviderQueries extends SchemaQueries<
  CaptchaProviderKeys,
  CreateCaptchaProvider,
  CaptchaProvider
> {
  constructor(public readonly pool: CommonQueryMethods) {
    super(pool, CaptchaProviders);
  }

  public readonly findCaptchaProvider = async (): Promise<CaptchaProvider | undefined> => {
    const [, providers] = await this.findAll();

    if (providers.length === 0) {
      return;
    }

    if (providers.length > 1) {
      // Not expected to happen
      throw new RequestError({
        code: 'captcha_provider.multiple_providers_not_allowed',
        status: 500,
      });
    }

    return providers[0];
  };

  public readonly upsertCaptchaProvider = async (
    captchaProvider: Pick<CaptchaProvider, 'config'>
  ): Promise<CaptchaProvider> => {
    const existing = await this.findCaptchaProvider();

    if (existing) {
      return this.updateById(existing.id, captchaProvider, 'replace');
    }

    return this.insert({
      ...captchaProvider,
      id: generateStandardId(),
    });
  };

  public readonly deleteCaptchaProvider = async (): Promise<void> => {
    const existing = await this.findCaptchaProvider();

    if (existing) {
      await this.deleteById(existing.id);
    }
  };
}
