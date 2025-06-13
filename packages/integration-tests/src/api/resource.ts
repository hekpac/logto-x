import type { Resource, CreateResource } from '@logto/schemas';
import { type Options } from 'ky';

import { generateResourceIndicator, generateResourceName } from '#src/utils.js';

import { authedApi } from './api.js';

export const createResource = async (name?: string, indicator?: string) =>
  authedApi
    .post('resources', {
      json: {
        name: name ?? generateResourceName(),
        indicator: indicator ?? generateResourceIndicator(),
      },
    })
    .json<Resource>();

export const getResources = async () => authedApi.get('resources').json<Resource[]>();

export const getResource = async (resourceId: string, options?: Options) =>
  authedApi.get(`resources/${resourceId}`, options).json<Resource>();

export const updateResource = async (
  resourceId: string,
  payload: Partial<Omit<CreateResource, 'id'>>
) =>
  authedApi
    .patch(`resources/${resourceId}`, {
      json: {
        ...payload,
      },
    })
    .json<Resource>();

export const deleteResource = async (resourceId: string) =>
  authedApi.delete(`resources/${resourceId}`);

export const setDefaultResource = async (resourceId: string, isDefault = true) =>
  authedApi
    .patch(`resources/${resourceId}/is-default`, { json: { isDefault } })
    .json<Resource>();
