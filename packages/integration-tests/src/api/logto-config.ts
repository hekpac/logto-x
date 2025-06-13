import {
  SupportedSigningKeyAlgorithm,
  type AdminConsoleData,
  type OidcConfigKeysResponse,
  type LogtoOidcConfigKeyType,
  type AccessTokenJwtCustomizer,
  type ClientCredentialsJwtCustomizer,
  type JwtCustomizerConfigs,
  type JwtCustomizerTestRequestBody,
  type Json,
} from '@logto/schemas';

import { authedApi } from './api.js';

export const getAdminConsoleConfig = async () =>
  authedApi.get('configs/admin-console').json<AdminConsoleData>();

export const updateAdminConsoleConfig = async (payload: Partial<AdminConsoleData>) =>
  authedApi
    .patch(`configs/admin-console`, {
      json: payload,
    })
    .json<AdminConsoleData>();

export const getOidcKeys = async (keyType: LogtoOidcConfigKeyType) =>
  authedApi.get(`configs/oidc/${keyType}`).json<OidcConfigKeysResponse[]>();

export const deleteOidcKey = async (keyType: LogtoOidcConfigKeyType, id: string) =>
  authedApi.delete(`configs/oidc/${keyType}/${id}`);

export const rotateOidcKeys = async (
  keyType: LogtoOidcConfigKeyType,
  signingKeyAlgorithm: SupportedSigningKeyAlgorithm = SupportedSigningKeyAlgorithm.EC
) =>
  authedApi
    .post(`configs/oidc/${keyType}/rotate`, { json: { signingKeyAlgorithm } })
    .json<OidcConfigKeysResponse[]>();

export const upsertJwtCustomizer = async (
  keyTypePath: 'access-token' | 'client-credentials',
  value: unknown
) =>
  authedApi
    .put(`configs/jwt-customizer/${keyTypePath}`, { json: value })
    .json<AccessTokenJwtCustomizer | ClientCredentialsJwtCustomizer>();

export const getJwtCustomizer = async (keyTypePath: 'access-token' | 'client-credentials') =>
  authedApi
    .get(`configs/jwt-customizer/${keyTypePath}`)
    .json<AccessTokenJwtCustomizer | ClientCredentialsJwtCustomizer>();

export const getJwtCustomizers = async () =>
  authedApi.get(`configs/jwt-customizer`).json<JwtCustomizerConfigs[]>();

export const deleteJwtCustomizer = async (keyTypePath: 'access-token' | 'client-credentials') =>
  authedApi.delete(`configs/jwt-customizer/${keyTypePath}`);

export const updateJwtCustomizer = async (
  keyTypePath: 'access-token' | 'client-credentials',
  value: unknown
) =>
  authedApi
    .patch(`configs/jwt-customizer/${keyTypePath}`, { json: value })
    .json<AccessTokenJwtCustomizer | ClientCredentialsJwtCustomizer>();

export const testJwtCustomizer = async (payload: JwtCustomizerTestRequestBody) =>
  authedApi
    .post(`configs/jwt-customizer/test`, {
      json: payload,
    })
    .json<Json>();
