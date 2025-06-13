import { InteractionEvent, MfaFactor } from '@logto/schemas';
import { useCallback, useMemo, useState } from 'react';

import useErrorHandler, { type ErrorHandlers } from '@/hooks/use-error-handler';
import useSendMfaPayload from '@/hooks/use-send-mfa-payload';
import useSubmitInteractionErrorHandler from '@/hooks/use-submit-interaction-error-handler';
import { type UserMfaFlow } from '@/types';

const useTotpCodeVerification = (errorCallback?: () => void) => {
  const [errorMessage, setErrorMessage] = useState<string>();
  const sendMfaPayload = useSendMfaPayload();
  const handleError = useErrorHandler();
  const preSignInErrorHandler = useSubmitInteractionErrorHandler(InteractionEvent.SignIn, {
    replace: true,
  });

  const invalidCodeErrorHandlers: ErrorHandlers = useMemo(
    () => ({
      'session.mfa.invalid_totp_code': (error) => {
        setErrorMessage(error.message);
      },
    }),
    []
  );

  const onSubmit = useCallback(
    async (
      code: string,
      payload:
        | { flow: UserMfaFlow.MfaBinding; verificationId: string }
        | { flow: UserMfaFlow.MfaVerification }
    ) => {
      const [error] = await sendMfaPayload({
        payload: { type: MfaFactor.TOTP, code },
        ...payload,
      });

      if (error) {
        await handleError(error, {
          ...invalidCodeErrorHandlers,
          ...preSignInErrorHandler,
        });
        errorCallback?.();
      }
    },
    [
      errorCallback,
      handleError,
      invalidCodeErrorHandlers,
      preSignInErrorHandler,
      sendMfaPayload,
    ]
  );

  return {
    errorMessage,
    onSubmit,
  };
};

export default useTotpCodeVerification;
