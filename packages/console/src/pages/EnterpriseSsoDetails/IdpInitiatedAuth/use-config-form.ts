import {
  type Application,
  ApplicationType,
  type SsoConnectorIdpInitiatedAuthConfig,
} from '@logto/schemas';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { type KeyedMutator } from 'swr';
import { useTranslation } from 'react-i18next';

import useApi from '@/hooks/use-api';
import { trySubmitSafe } from '@/utils/form';

import {
  buildIdpInitiatedAuthConfigEndpoint,
  type IdpInitiatedAuthConfigFormData,
  parseFormDataToRequestPayload,
  parseResponseToFormData,
} from './utils';

export type UseConfigFormParams = {
  readonly ssoConnectorId: string;
  readonly applications: Application[];
  readonly idpInitiatedAuthConfig: SsoConnectorIdpInitiatedAuthConfig | undefined;
  readonly mutateIdpInitiatedConfig: KeyedMutator<SsoConnectorIdpInitiatedAuthConfig>;
};

const useConfigForm = ({
  ssoConnectorId,
  applications,
  idpInitiatedAuthConfig,
  mutateIdpInitiatedConfig,
}: UseConfigFormParams) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const api = useApi();

  const formMethods = useForm<IdpInitiatedAuthConfigFormData>({
    defaultValues: parseResponseToFormData(idpInitiatedAuthConfig, applications),
  });

  const { watch, setValue, handleSubmit, reset, formState, control, register } = formMethods;
  const { isDirty, isSubmitting, errors } = formState;

  const isIdpInitiatedSsoEnabled = watch('isIdpInitiatedSsoEnabled');
  const defaultApplicationId = watch('config.defaultApplicationId');
  const autoSendAuthorizationRequest = watch('config.autoSendAuthorizationRequest');

  const defaultApplication = useMemo(
    () => applications.find((application) => application.id === defaultApplicationId),
    [applications, defaultApplicationId]
  );

  const defaultApplicationRedirectUris = useMemo(
    () => defaultApplication?.oidcClientMetadata.redirectUris ?? [],
    [defaultApplication]
  );

  useEffect(() => {
    if (defaultApplication?.type === ApplicationType.SPA) {
      setValue('config.autoSendAuthorizationRequest', false);
      setValue('config.redirectUri', undefined);
    }
  }, [defaultApplication, setValue]);

  const onSubmit = handleSubmit(
    trySubmitSafe(async (data) => {
      const { config, isIdpInitiatedSsoEnabled } = data;

      if (isSubmitting) {
        return;
      }

      if (!isIdpInitiatedSsoEnabled || !config) {
        await api.delete(buildIdpInitiatedAuthConfigEndpoint(ssoConnectorId));
        await mutateIdpInitiatedConfig();
        toast.success(t('general.saved'));
        reset(parseResponseToFormData(undefined, applications));
        return;
      }

      const result = parseFormDataToRequestPayload(config);
      if (!result.success) {
        return;
      }
      const payload = result.data;

      const updated = await api
        .put(buildIdpInitiatedAuthConfigEndpoint(ssoConnectorId), { json: payload })
        .json<SsoConnectorIdpInitiatedAuthConfig>();
      await mutateIdpInitiatedConfig(updated);
      toast.success(t('general.saved'));
      reset(parseResponseToFormData(updated));
    })
  );

  return {
    formMethods,
    onSubmit,
    isIdpInitiatedSsoEnabled,
    autoSendAuthorizationRequest,
    defaultApplication,
    defaultApplicationRedirectUris,
    errors,
    isDirty,
    isSubmitting,
    register,
    control,
    reset,
  };
};

export default useConfigForm;
