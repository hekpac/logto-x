import { InteractionEvent } from '@logto/schemas';
import { useCallback } from 'react';

import { skipMfa } from '@/apis/experience';

import useApi from './use-api';
import useErrorHandler from './use-error-handler';
import useGlobalRedirectTo from './use-global-redirect-to';
import useSubmitInteractionErrorHandler from './use-submit-interaction-error-handler';

const useSkipMfa = () => {
  const asyncSkipMfa = useApi(skipMfa);
  const redirectTo = useGlobalRedirectTo();

  const handleError = useErrorHandler();
  const signInErrorHandler = useSubmitInteractionErrorHandler(InteractionEvent.SignIn, {
    replace: true,
  });
  const handleSkipMfaError = useCallback(
    (error: unknown) => handleError(error, signInErrorHandler),
    [handleError, signInErrorHandler]
  );

  return useCallback(async () => {
    const [error, result] = await asyncSkipMfa();
    if (error) {
      await handleSkipMfaError(error);
      return;
    }

    if (result) {
      await redirectTo(result.redirectTo);
    }
  }, [asyncSkipMfa, handleSkipMfaError, redirectTo]);
};

export default useSkipMfa;
