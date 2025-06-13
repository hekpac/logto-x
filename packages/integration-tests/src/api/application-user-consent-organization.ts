import { type Organization } from '@logto/schemas';

import { authedApi } from './api.js';

export const postApplicationUserConsentOrganization = async (
  applicationId: string,
  userId: string,
  payload: {
    organizationIds: string[];
  }
) =>
  authedApi.post(`applications/${applicationId}/users/${userId}/consent-organizations`, {
    json: payload,
  });

export const putApplicationUserConsentOrganization = async (
  applicationId: string,
  userId: string,
  payload: {
    organizationIds: string[];
  }
) =>
  authedApi.put(`applications/${applicationId}/users/${userId}/consent-organizations`, {
    json: payload,
  });

export const getApplicationUserConsentOrganization = async (
  applicationId: string,
  userId: string
) =>
  authedApi.get(`applications/${applicationId}/users/${userId}/consent-organizations`).json<{
    organizations: Organization[];
  }>();

export const deleteApplicationUserConsentOrganization = async (
  applicationId: string,
  userId: string,
  organizationId: string
) =>
  authedApi.delete(
    `applications/${applicationId}/users/${userId}/consent-organizations/${organizationId}`
  );
