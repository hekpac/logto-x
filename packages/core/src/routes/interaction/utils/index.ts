import {
  type SocialConnectorPayload,
  type User,
  type IdentifierPayload,
  type VerifyVerificationCodePayload,
} from '@logto/schemas';

import type { PasswordIdentifierPayload } from '../types/index.js';

export const isPasswordIdentifier = (
  identifier: IdentifierPayload
): identifier is PasswordIdentifierPayload => 'password' in identifier;

export const isVerificationCodeIdentifier = (
  identifier: IdentifierPayload
): identifier is VerifyVerificationCodePayload => 'verificationCode' in identifier;

export const isSocialIdentifier = (
  identifier: IdentifierPayload
): identifier is SocialConnectorPayload =>
  'connectorId' in identifier && 'connectorData' in identifier;

export const isConnectorEmailIdentifier = (
  identifier: IdentifierPayload
): identifier is { connectorId: string; email: string } =>
  'connectorId' in identifier && 'email' in identifier;

export const isConnectorPhoneIdentifier = (
  identifier: IdentifierPayload
): identifier is { connectorId: string; phone: string } =>
  'connectorId' in identifier && 'phone' in identifier;

// Social identities can take place the role of password
export const isUserPasswordSet = ({
  passwordEncrypted,
  identities,
}: Pick<User, 'passwordEncrypted' | 'identities'>): boolean => {
  return Boolean(passwordEncrypted) || Object.keys(identities).length > 0;
};
