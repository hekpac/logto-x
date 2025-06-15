import { type UserProfileResponse } from '@logto/schemas';
import { type KyInstance } from 'ky';

export const updatePassword = async (
  api: KyInstance,
  verificationRecordId: string,
  password: string
) =>
  api.post('api/my-account/password', {
    json: { password },
  });

export const updatePrimaryEmail = async (
  api: KyInstance,
  email: string,
  verificationRecordId: string,
  newIdentifierVerificationRecordId: string
) =>
  api.post('api/my-account/primary-email', {
    json: { email, newIdentifierVerificationRecordId },
  });

export const deletePrimaryEmail = async (api: KyInstance, verificationRecordId: string) =>
  api.delete('api/my-account/primary-email');

export const updatePrimaryPhone = async (
  api: KyInstance,
  phone: string,
  verificationRecordId: string,
  newIdentifierVerificationRecordId: string
) =>
  api.post('api/my-account/primary-phone', {
    json: { phone, newIdentifierVerificationRecordId },
  });

export const deletePrimaryPhone = async (api: KyInstance, verificationRecordId: string) =>
  api.delete('api/my-account/primary-phone');

export const updateIdentities = async (
  api: KyInstance,
  verificationRecordId: string,
  newIdentifierVerificationRecordId: string
) =>
  api.post('api/my-account/identities', {
    json: { newIdentifierVerificationRecordId },
  });

export const deleteIdentity = async (
  api: KyInstance,
  target: string,
  verificationRecordId: string
) =>
  api.delete(`api/my-account/identities/${target}`);

export const updateUser = async (api: KyInstance, body: Record<string, unknown>) =>
  api.patch('api/my-account', { json: body }).json<Partial<UserProfileResponse>>();

export const updateOtherProfile = async (api: KyInstance, body: Record<string, unknown>) =>
  api
    .patch('api/my-account/profile', { json: body })
    .json<Partial<UserProfileResponse['profile']>>();

export const getUserInfo = async (api: KyInstance) =>
  api.get('api/my-account').json<Partial<UserProfileResponse>>();
