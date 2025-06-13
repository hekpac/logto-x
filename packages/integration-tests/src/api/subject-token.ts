import type { JsonObject, SubjectTokenResponse } from '@logto/schemas';

import { authedApi } from './api.js';

export const createSubjectToken = async (userId: string, context?: JsonObject) =>
  authedApi
    .post('subject-tokens', {
      json: {
        userId,
        context,
      },
    })
    .json<SubjectTokenResponse>();
