import { type BindMfaPayload, type VerifyMfaPayload } from '@logto/schemas';
import { useCallback } from 'react';

import { bindMfa, verifyMfa } from '@/apis/experience';
import { UserMfaFlow } from '@/types';

import useApi from './use-api';
import useGlobalRedirectTo from './use-global-redirect-to';

export type SendMfaPayloadApiOptions =
  | {
      flow: UserMfaFlow.MfaBinding;
      payload: BindMfaPayload;
      verificationId: string;
    }
  | {
      flow: UserMfaFlow.MfaVerification;
      payload: VerifyMfaPayload;
      verificationId?: string;
    };

const sendMfaPayloadApi = async ({ flow, payload, verificationId }: SendMfaPayloadApiOptions) => {
  if (flow === UserMfaFlow.MfaBinding) {
    return bindMfa(payload, verificationId);
  }
  return verifyMfa(payload, verificationId);
};

const useSendMfaPayload = () => {
  const asyncSendMfaPayload = useApi(sendMfaPayloadApi);
  const redirectTo = useGlobalRedirectTo();

  return useCallback(
    async (apiOptions: SendMfaPayloadApiOptions) => {
      const resultTuple = await asyncSendMfaPayload(apiOptions);
      const [, result] = resultTuple;

      if (result) {
        await redirectTo(result.redirectTo);
      }

      return resultTuple;
    },
    [asyncSendMfaPayload, redirectTo]
  );
};

export default useSendMfaPayload;
