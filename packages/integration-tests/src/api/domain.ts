import type { DomainResponse } from '@logto/schemas';

import { generateDomain } from '#src/test-env-utils.js';

import { authedApi } from './api.js';

export const createDomain = async (domain?: string) =>
  authedApi
    .post('domains', {
      json: {
        domain: domain ?? generateDomain(),
      },
    })
    .json<DomainResponse>();

export const getDomains = async () => authedApi.get('domains').json<DomainResponse[]>();

export const getDomain = async (domainId: string) =>
  authedApi.get(`domains/${domainId}`).json<DomainResponse>();

export const deleteDomain = async (domainId: string) =>
  authedApi.delete(`domains/${domainId}`);
