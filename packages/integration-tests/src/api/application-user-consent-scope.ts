import { type UserScope } from '@logto/core-kit';
import {
  type ApplicationUserConsentScopeType,
  type ApplicationUserConsentScopesResponse,
} from '@logto/schemas';

import { authedApi } from './api.js';

export const assignUserConsentScopes = async (
  applicationId: string,
  payload: {
    organizationScopes?: string[];
    resourceScopes?: string[];
    organizationResourceScopes?: string[];
    userScopes?: UserScope[];
  }
) => authedApi.post(`applications/${applicationId}/user-consent-scopes`, { json: payload });

export const getUserConsentScopes = async (applicationId: string) =>
  authedApi
    .get(`applications/${applicationId}/user-consent-scopes`)
    .json<ApplicationUserConsentScopesResponse>();

export const deleteUserConsentScopes = async (
  applicationId: string,
  scopeType: ApplicationUserConsentScopeType,
  scopeId: string
) =>
  authedApi.delete(
    `applications/${applicationId}/user-consent-scopes/${scopeType}/${scopeId}`
  );
