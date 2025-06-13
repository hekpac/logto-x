import type { Scope, CreateScope } from '@logto/schemas';
import { type Options } from 'ky';

import { generateScopeName } from '#src/utils.js';

import { authedApi } from './api.js';

export const getScopes = async (resourceId: string, options?: Options) =>
  authedApi.get(`resources/${resourceId}/scopes`, options).json<Scope[]>();

export const createScope = async (resourceId: string, name?: string) => {
  const scopeName = name ?? generateScopeName();

  return authedApi
    .post(`resources/${resourceId}/scopes`, {
      json: {
        name: scopeName,
        description: scopeName,
      },
    })
    .json<Scope>();
};

export const updateScope = async (
  resourceId: string,
  scopeId: string,
  payload: Partial<Omit<CreateScope, 'id' | 'resourceId'>>
) =>
  authedApi
    .patch(`resources/${resourceId}/scopes/${scopeId}`, {
      json: {
        ...payload,
      },
    })
    .json<Scope>();

export const deleteScope = async (resourceId: string, scopeId: string) =>
  authedApi.delete(`resources/${resourceId}/scopes/${scopeId}`);
