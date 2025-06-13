import {
  type ApplicationSignInExperienceCreate,
  type ApplicationSignInExperience,
} from '@logto/schemas';

import { authedApi } from './api.js';

export const setApplicationSignInExperience = async (
  applicationId: string,
  payload: ApplicationSignInExperienceCreate
) =>
  authedApi
    .put(`applications/${applicationId}/sign-in-experience`, { json: payload })
    .json<ApplicationSignInExperience>();

export const getApplicationSignInExperience = async (applicationId: string) =>
  authedApi
    .get(`applications/${applicationId}/sign-in-experience`)
    .json<ApplicationSignInExperience>();
