import type { SignInExperience } from '@logto/schemas';
import { type KyInstance } from 'ky';

import { authedApi } from './api.js';

export const getSignInExperience = async (api: KyInstance = authedApi) =>
  api.get('sign-in-exp').json<SignInExperience>();

export const updateSignInExperience = async (
  signInExperience: Partial<SignInExperience>,
  api: KyInstance = authedApi
) =>
  api
    .patch('sign-in-exp', {
      json: signInExperience,
    })
    .json<SignInExperience>();
