import { type OneTimeTokenStatus, type OneTimeToken } from '@logto/schemas';

import { authedApi } from './api.js';

export type CreateOneTimeToken = Pick<OneTimeToken, 'email'> &
  Partial<Pick<OneTimeToken, 'context'>> & { expiresIn?: number };

export const createOneTimeToken = async (createOneTimeToken: CreateOneTimeToken) =>
  authedApi
    .post('one-time-tokens', {
      json: createOneTimeToken,
    })
    .json<OneTimeToken>();

export const verifyOneTimeToken = async (
  verifyOneTimeToken: Pick<OneTimeToken, 'email' | 'token'>
) =>
  authedApi
    .post('one-time-tokens/verify', {
      json: verifyOneTimeToken,
    })
    .json<OneTimeToken>();

export const getOneTimeTokenById = async (id: string) =>
  authedApi.get(`one-time-tokens/${id}`).json<OneTimeToken>();

export const updateOneTimeTokenStatus = async (id: string, status: OneTimeTokenStatus) =>
  authedApi
    .put(`one-time-tokens/${id}/status`, {
      json: { status },
    })
    .json<OneTimeToken>();

export const deleteOneTimeTokenById = async (id: string) =>
  authedApi.delete(`one-time-tokens/${id}`).json<OneTimeToken>();

export const getOneTimeTokens = async (searchParams?: Record<string, string>) =>
  authedApi.get('one-time-tokens', { searchParams }).json<OneTimeToken[]>();
