import { type CaptchaProvider } from '@logto/schemas';
import { type KyInstance } from 'ky';

import { authedApi } from './api.js';

export const getCaptchaProvider = async (api: KyInstance = authedApi) =>
  api.get('captcha-provider').json<CaptchaProvider>();

export const updateCaptchaProvider = async (
  captchaProvider: Partial<CaptchaProvider>,
  api: KyInstance = authedApi
) =>
  api
    .put('captcha-provider', {
      json: captchaProvider,
    })
    .json<CaptchaProvider>();

export const deleteCaptchaProvider = async (api: KyInstance = authedApi) =>
  api.delete('captcha-provider').json<CaptchaProvider>();
