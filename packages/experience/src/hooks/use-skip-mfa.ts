import { useCallback } from 'react';

import { skipMfa } from '@/apis/experience';

import useApi from './use-api';
import useGlobalRedirectTo from './use-global-redirect-to';
import useSkipMfaErrorHandler from './use-skip-mfa-error-handler';

const useSkipMfa = () => {
  const asyncSkipMfa = useApi(skipMfa);
  const redirectTo = useGlobalRedirectTo();

  const handleSkipMfaError = useSkipMfaErrorHandler();

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
