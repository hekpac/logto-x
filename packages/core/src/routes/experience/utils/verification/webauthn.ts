import {
  type BindWebAuthnPayload,
  MfaFactor,
  type MfaVerificationWebAuthn,
  type MfaVerifications,
  type WebAuthnVerificationPayload,
  type VerifyMfaResult,
} from '@logto/schemas';
import {
  verifyRegistrationResponse,
  type VerifyRegistrationResponseOpts,
  verifyAuthenticationResponse,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

import RequestError from '#src/errors/RequestError/index.js';

export const verifyWebAuthnRegistration = async (
  payload: Omit<BindWebAuthnPayload, 'type'>,
  challenge: string,
  origins: string[]
) => {
  const options: VerifyRegistrationResponseOpts = {
    response: {
      ...payload,
      type: 'public-key',
    },
    expectedChallenge: challenge,
    expectedOrigin: origins,
    requireUserVerification: false,
  };

  try {
    return await verifyRegistrationResponse(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new RequestError('session.mfa.webauthn_verification_failed', {
      message,
    });
  }
};


type VerifyWebAuthnAuthenticationParameters = {
  payload: Omit<WebAuthnVerificationPayload, 'type'>;
  challenge: string;
  rpId: string;
  origin: string;
  mfaVerifications: MfaVerifications;
};

export const verifyWebAuthnAuthentication = async ({
  payload,
  challenge,
  rpId,
  origin,
  mfaVerifications,
}: VerifyWebAuthnAuthenticationParameters): Promise<{
  result: false | VerifyMfaResult;
  newCounter?: number;
}> => {
  const webAuthnVerifications = mfaVerifications.filter(
    (verification): verification is MfaVerificationWebAuthn =>
      verification.type === MfaFactor.WebAuthn
  );
  const verification = webAuthnVerifications.find(
    ({ credentialId }) => credentialId === payload.id
  );

  if (!verification) {
    return { result: false };
  }

  const { publicKey, credentialId, counter, transports, id } = verification;

  const options: VerifyAuthenticationResponseOpts = {
    response: {
      ...payload,
      type: 'public-key',
    },
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpId,
    authenticator: {
      credentialPublicKey: isoBase64URL.toBuffer(publicKey),
      credentialID: credentialId,
      counter,
      transports,
    },
    requireUserVerification: true,
  };

  try {
    const { verified, authenticationInfo } = await verifyAuthenticationResponse(options);
    if (!verified) {
      return { result: false };
    }
    return {
      result: {
        type: MfaFactor.WebAuthn,
        id,
      },
      newCounter: authenticationInfo.newCounter,
    };
  } catch {
    return { result: false };
  }
};
