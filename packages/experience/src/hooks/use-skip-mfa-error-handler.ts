import { InteractionEvent } from '@logto/schemas';
import { useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { getInteractionEventFromState } from '@/apis/utils';

import useErrorHandler from './use-error-handler';
import useSubmitInteractionErrorHandler from './use-submit-interaction-error-handler';

const useSkipMfaErrorHandler = () => {
  const { state } = useLocation();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- location state is unknown
  const interactionEvent = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- state type is unknown
    () => getInteractionEventFromState(state) ?? InteractionEvent.SignIn,
    [state]
  );

  const submitErrorHandler = useSubmitInteractionErrorHandler(interactionEvent, {
    replace: true,
  });
  const handleError = useErrorHandler();

  return useCallback(
    (error: unknown) => handleError(error, submitErrorHandler),
    [handleError, submitErrorHandler]
  );
};

export default useSkipMfaErrorHandler;
