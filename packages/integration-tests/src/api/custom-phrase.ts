import type { CustomPhrase, Translation } from '@logto/schemas';

import { authedApi } from './api.js';

export const listCustomPhrases = async () =>
  authedApi.get('custom-phrases').json<CustomPhrase[]>();

export const getCustomPhrase = async (languageTag: string) =>
  authedApi.get(`custom-phrases/${languageTag}`).json<CustomPhrase>();

export const createOrUpdateCustomPhrase = async (languageTag: string, translation: Translation) =>
  authedApi.put(`custom-phrases/${languageTag}`, { json: translation }).json<CustomPhrase>();

export const deleteCustomPhrase = async (languageTag: string) =>
  authedApi.delete(`custom-phrases/${languageTag}`).json();
