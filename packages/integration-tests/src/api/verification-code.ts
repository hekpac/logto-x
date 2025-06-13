import type { VerifyVerificationCodePayload } from '@logto/schemas';

import { authedApi } from './api.js';

export const requestVerificationCode = async (payload: unknown) =>
  authedApi.post('verification-codes', { json: payload });

export const verifyVerificationCode = async (payload: VerifyVerificationCodePayload) =>
  authedApi.post('verification-codes/verify', { json: payload });
