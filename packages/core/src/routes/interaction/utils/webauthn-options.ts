import {
  MfaFactor,
  type MfaVerificationWebAuthn,
  type MfaVerifications,
  type User,
  type WebAuthnRegistrationOptions,
} from '@logto/schemas';
import { getUserDisplayName } from '@logto/shared';
import {
  type GenerateRegistrationOptionsOpts,
  generateRegistrationOptions,
  type GenerateAuthenticationOptionsOpts,
  generateAuthenticationOptions,
} from '@simplewebauthn/server';

import RequestError from '#src/errors/RequestError/index.js';

export type GenerateWebAuthnRegistrationOptionsParameters = {
  rpId: string;
  user: Pick<
    User,
    'id' | 'name' | 'username' | 'primaryEmail' | 'primaryPhone' | 'mfaVerifications'
  >;
};

export const generateWebAuthnRegistrationOptions = async ({
  rpId,
  user,
}: GenerateWebAuthnRegistrationOptionsParameters): Promise<WebAuthnRegistrationOptions> => {
  const { username, name, primaryEmail, primaryPhone, id, mfaVerifications } = user;

  const options: GenerateRegistrationOptionsOpts = {
    rpName: rpId,
    rpID: rpId,
    userID: Uint8Array.from(Buffer.from(id)),
    userName: getUserDisplayName({ username, primaryEmail, primaryPhone }) ?? 'Unnamed User',
    userDisplayName:
      getUserDisplayName({ name, username, primaryEmail, primaryPhone }) ?? 'Unnamed User',
    timeout: 60_000,
    attestationType: 'none',
    excludeCredentials: mfaVerifications
      .filter(
        (verification): verification is MfaVerificationWebAuthn =>
          verification.type === MfaFactor.WebAuthn
      )
      .map(({ credentialId, transports }) => ({
        id: credentialId,
        type: 'public-key',
        transports,
      })),
    authenticatorSelection: {
      residentKey: 'discouraged',
    },
    // Values for COSEALG.ES256, COSEALG.RS256, Node.js don't have those enums
    supportedAlgorithmIDs: [-7, -257],
  };

  return generateRegistrationOptions(options);
};

export const generateWebAuthnAuthenticationOptions = async ({
  rpId,
  mfaVerifications,
}: {
  rpId: string;
  mfaVerifications: MfaVerifications;
}) => {
  const webAuthnVerifications = mfaVerifications.filter(
    (verification): verification is MfaVerificationWebAuthn =>
      verification.type === MfaFactor.WebAuthn
  );

  if (webAuthnVerifications.length === 0) {
    throw new RequestError('session.mfa.webauthn_verification_not_found');
  }

  const options: GenerateAuthenticationOptionsOpts = {
    timeout: 60_000,
    allowCredentials: webAuthnVerifications.map(({ credentialId, transports }) => ({
      id: credentialId,
      type: 'public-key',
      transports,
    })),
    userVerification: 'required',
    rpID: rpId,
  };
  return generateAuthenticationOptions(options);
};
