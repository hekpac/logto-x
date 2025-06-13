import type {
  CreatePersonalAccessToken,
  Identities,
  Identity,
  MfaFactor,
  MfaVerification,
  OrganizationWithRoles,
  PersonalAccessToken,
  Role,
  User,
  UserSsoIdentity,
  UsersPasswordEncryptionMethod,
} from '@logto/schemas';
import { conditional } from '@silverhand/essentials';

import { authedApi } from './api.js';

export type CreateUserPayload = Partial<{
  primaryEmail: string;
  primaryPhone: string;
  username: string;
  password: string;
  name: string;
  passwordDigest: string;
  passwordAlgorithm: UsersPasswordEncryptionMethod;
}>;

export const createUser = async (payload: CreateUserPayload = {}) =>
  authedApi
    .post('users', {
      json: payload,
    })
    .json<User>();

export const getUser = async (userId: string, withSsoIdentities = false) =>
  authedApi
    .get(
      `users/${userId}`,
      conditional(
        withSsoIdentities && { searchParams: new URLSearchParams({ includeSsoIdentities: 'true' }) }
      )
    )
    .json<User & { ssoIdentities?: UserSsoIdentity[] }>();

export const getUsers = async () => authedApi.get('users').json<User[]>();

export const updateUser = async (userId: string, payload: Partial<User>) =>
  authedApi
    .patch(`users/${userId}`, {
      json: payload,
    })
    .json<User>();

export const updateUserProfile = async (userId: string, profile: Partial<User['profile']>) =>
  authedApi
    .patch(`users/${userId}/profile`, {
      json: { profile },
    })
    .json<User['profile']>();

export const suspendUser = async (userId: string, isSuspended: boolean) =>
  authedApi.patch(`users/${userId}/is-suspended`, { json: { isSuspended } }).json<User>();

export const deleteUser = async (userId: string) => authedApi.delete(`users/${userId}`);

export const updateUserPassword = async (userId: string, password: string) =>
  authedApi
    .patch(`users/${userId}/password`, {
      json: {
        password,
      },
    })
    .json<User>();

export const deleteUserIdentity = async (userId: string, connectorTarget: string) =>
  authedApi.delete(`users/${userId}/identities/${connectorTarget}`);

export const assignRolesToUser = async (userId: string, roleIds: string[]) =>
  authedApi.post(`users/${userId}/roles`, { json: { roleIds } });

export const putRolesToUser = async (userId: string, roleIds: string[]) =>
  authedApi.put(`users/${userId}/roles`, { json: { roleIds } });

/**
 * Get roles assigned to the user.
 *
 * @param userId Concerned user id
 * @param keyword Search among all roles (on `id`, `name` and `description` fields) assigned to the user with `keyword`
 * @returns All roles which contains the keyword assigned to the user
 */
export const getUserRoles = async (userId: string, keyword?: string) => {
  const searchParams = new URLSearchParams(keyword && [['search', `%${keyword}%`]]);
  return authedApi.get(`users/${userId}/roles`, { searchParams }).json<Role[]>();
};

export const deleteRoleFromUser = async (userId: string, roleId: string) =>
  authedApi.delete(`users/${userId}/roles/${roleId}`);

export const postUserIdentity = async (
  userId: string,
  connectorId: string,
  connectorData: Record<string, unknown>
) =>
  authedApi
    .post(`users/${userId}/identities`, {
      json: {
        connectorId,
        connectorData,
      },
    })
    .json<Identities>();

export const putUserIdentity = async (userId: string, target: string, identity: Identity) =>
  authedApi.put(`users/${userId}/identities/${target}`, { json: identity }).json<Identities>();

export const verifyUserPassword = async (userId: string, password: string) =>
  authedApi.post(`users/${userId}/password/verify`, { json: { password } });

export const getUserMfaVerifications = async (userId: string) =>
  authedApi.get(`users/${userId}/mfa-verifications`).json<MfaVerification[]>();

export const deleteUserMfaVerification = async (userId: string, mfaVerificationId: string) =>
  authedApi.delete(`users/${userId}/mfa-verifications/${mfaVerificationId}`);

export const createUserMfaVerification = async (userId: string, type: MfaFactor) =>
  authedApi
    .post(`users/${userId}/mfa-verifications`, { json: { type } })
    .json<
      | { type: MfaFactor.TOTP; secret: string; secretQrCode: string }
      | { type: MfaFactor.BackupCode; codes: string[] }
    >();

export const getUserOrganizations = async (userId: string) =>
  authedApi.get(`users/${userId}/organizations`).json<OrganizationWithRoles[]>();

export const createPersonalAccessToken = async ({
  userId,
  ...body
}: Omit<CreatePersonalAccessToken, 'value'>) =>
  authedApi
    .post(`users/${userId}/personal-access-tokens`, { json: body })
    .json<PersonalAccessToken>();

export const getUserPersonalAccessTokens = async (userId: string) =>
  authedApi.get(`users/${userId}/personal-access-tokens`).json<PersonalAccessToken[]>();

export const deletePersonalAccessToken = async (userId: string, name: string) =>
  authedApi.delete(`users/${userId}/personal-access-tokens/${name}`);

export const updatePersonalAccessToken = async (
  userId: string,
  name: string,
  body: Record<string, unknown>
) =>
  authedApi
    .patch(`users/${userId}/personal-access-tokens/${name}`, {
      json: body,
    })
    .json<PersonalAccessToken>();
