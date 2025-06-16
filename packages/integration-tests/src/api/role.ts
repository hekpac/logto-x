import type { CreateRole, Role, Scope, User, Application } from '@logto/schemas';
import { RoleType } from '@logto/schemas';

import { generateRoleName } from '#src/test-env-utils.js';

import { authedApi } from './api.js';

export type GetRoleOptions = {
  excludeUserId?: string;
  excludeApplicationId?: string;
  type?: RoleType;
  search?: string;
};

export const createRole = async ({
  name,
  description,
  type,
  isDefault,
  scopeIds,
}: {
  name?: string;
  description?: string;
  type?: RoleType;
  isDefault?: boolean;
  scopeIds?: string[];
}) =>
  authedApi
    .post('roles', {
      json: {
        name: name ?? generateRoleName(),
        description: description ?? generateRoleName(),
        isDefault,
        type: type ?? RoleType.User,
        scopeIds,
      },
    })
    .json<Role>();

export const getRoles = async (options?: GetRoleOptions) =>
  authedApi.get('roles', { searchParams: new URLSearchParams(options) }).json<Role[]>();

export const getRole = async (roleId: string) => authedApi.get(`roles/${roleId}`).json<Role>();

export const updateRole = async (roleId: string, payload: Partial<Omit<CreateRole, 'id'>>) =>
  authedApi
    .patch(`roles/${roleId}`, {
      json: {
        ...payload,
      },
    })
    .json<Role>();

export const deleteRole = async (roleId: string) => authedApi.delete(`roles/${roleId}`);

export const getRoleScopes = async (roleId: string) =>
  authedApi.get(`roles/${roleId}/scopes`).json<Scope[]>();

export const assignScopesToRole = async (scopeIds: string[], roleId: string) =>
  authedApi
    .post(`roles/${roleId}/scopes`, {
      json: { scopeIds },
    })
    .json<Scope[]>();

export const deleteScopeFromRole = async (scopeId: string, roleId: string) =>
  authedApi.delete(`roles/${roleId}/scopes/${scopeId}`);

/**
 * Get users assigned to the role.
 *
 * @param roleId Concerned role id.
 * @param keyword Search among all users (on `id`, `name` and `description` fields) assigned to the role with `keyword`.
 * @returns A Promise that resolves all users which contains the keyword assigned to the role.
 */
export const getRoleUsers = async (roleId: string, keyword?: string) => {
  const searchParams = new URLSearchParams(keyword && [['search', `%${keyword}%`]]);
  return authedApi.get(`roles/${roleId}/users`, { searchParams }).json<User[]>();
};

export const assignUsersToRole = async (userIds: string[], roleId: string) =>
  authedApi.post(`roles/${roleId}/users`, {
    json: { userIds },
  });

export const deleteUserFromRole = async (userId: string, roleId: string) =>
  authedApi.delete(`roles/${roleId}/users/${userId}`);

/**
 * Get apps assigned to the role.
 *
 * @param roleId Concerned role id.
 * @param keyword Search among all m2m apps (on `id`, `name` and `description` fields) assigned to the role with `keyword`.
 * @returns A Promise that resolves all m2m apps which contains the keyword assigned to the role.
 */
export const getRoleApplications = async (roleId: string, keyword?: string) => {
  const searchParams = new URLSearchParams(keyword && [['search', `%${keyword}%`]]);
  return authedApi.get(`roles/${roleId}/applications`, { searchParams }).json<Application[]>();
};

export const assignApplicationsToRole = async (applicationIds: string[], roleId: string) =>
  authedApi.post(`roles/${roleId}/applications`, {
    json: { applicationIds },
  });

export const deleteApplicationFromRole = async (applicationId: string, roleId: string) =>
  authedApi.delete(`roles/${roleId}/applications/${applicationId}`);
