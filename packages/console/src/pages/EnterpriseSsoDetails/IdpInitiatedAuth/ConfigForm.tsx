import {
  type Application,
  type SsoConnectorWithProviderConfig,
  ApplicationType,
  type SsoConnectorIdpInitiatedAuthConfig,
} from '@logto/schemas';
import { type ReactElement, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { type KeyedMutator } from 'swr';

import DetailsForm from '@/components/DetailsForm';
import FormCard from '@/components/FormCard';
import CodeEditor from '@/ds-components/CodeEditor';
import FormField from '@/ds-components/FormField';
import RadioGroup, { Radio } from '@/ds-components/RadioGroup';
import Select from '@/ds-components/Select';
import Switch from '@/ds-components/Switch';
import TextInput from '@/ds-components/TextInput';
import useTenantPathname from '@/hooks/use-tenant-pathname';

import styles from './index.module.scss';
import useConfigForm from './use-config-form';

type FormProps = {
  readonly ssoConnector: SsoConnectorWithProviderConfig;
  readonly applications: Application[];
  readonly idpInitiatedAuthConfig: SsoConnectorIdpInitiatedAuthConfig | undefined;
  readonly mutateIdpInitiatedConfig: KeyedMutator<SsoConnectorIdpInitiatedAuthConfig>;
};

function ConfigForm({
  ssoConnector,
  applications,
  idpInitiatedAuthConfig,
  mutateIdpInitiatedConfig,
}: FormProps) {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { getTo } = useTenantPathname();

  const {
    formMethods: {
      control,
      register,
      formState: { isDirty, isSubmitting, errors },
      reset,
    },
    onSubmit,
    isIdpInitiatedSsoEnabled,
    autoSendAuthorizationRequest,
    defaultApplication,
    defaultApplicationRedirectUris,
  } = useConfigForm({
    ssoConnectorId: ssoConnector.id,
    applications,
    idpInitiatedAuthConfig,
    mutateIdpInitiatedConfig,
  });

  const emptyApplicationsError = useMemo<ReactElement | undefined>(() => {
    if (applications.length === 0) {
      return (
        <Trans
          components={{
            a: <Link className={styles.inlineLink} to={getTo('/applications')} />,
          }}
        >
          {t('enterprise_sso_details.idp_initiated_auth_config.empty_applications_error')}
        </Trans>
      );
    }
  }, [applications, getTo, t]);

  const emptyRedirectUrisError = useMemo(() => {
    if (defaultApplication && defaultApplicationRedirectUris.length === 0) {
      return t('enterprise_sso_details.idp_initiated_auth_config.empty_redirect_uris_error');
    }
  }, [defaultApplication, defaultApplicationRedirectUris.length, t]);

  return (
    <DetailsForm
      isDirty={isDirty}
      isSubmitting={isSubmitting}
      onDiscard={reset}
      onSubmit={onSubmit}
    >
      <FormCard
        title="enterprise_sso_details.idp_initiated_auth_config.card_title"
        description="enterprise_sso_details.idp_initiated_auth_config.card_description"
      >
        <FormField title="enterprise_sso_details.idp_initiated_auth_config.enable_idp_initiated_sso">
          <Switch
            required
            description="enterprise_sso_details.idp_initiated_auth_config.enable_idp_initiated_sso_description"
            {...register('isIdpInitiatedSsoEnabled')}
          />
        </FormField>

        {isIdpInitiatedSsoEnabled && (
          <>
            <FormField
              isRequired
              title="enterprise_sso_details.idp_initiated_auth_config.default_application"
              tip={t(
                'enterprise_sso_details.idp_initiated_auth_config.default_application_tooltip'
              )}
            >
              <Controller
                control={control}
                name="config.defaultApplicationId"
                rules={{
                  required: t('errors.required_field_missing', {
                    field: t(
                      'enterprise_sso_details.idp_initiated_auth_config.default_application'
                    ),
                  }),
                }}
                render={({ field: { value, onChange } }) => (
                  <Select
                    placeholder={t(
                      'enterprise_sso_details.idp_initiated_auth_config.empty_applications_placeholder'
                    )}
                    options={applications.map((application) => ({
                      value: application.id,
                      title: (
                        <span>
                          {application.name}
                          <span className={styles.applicationDetails}>
                            ({t(`guide.categories.${application.type}`)}, ID: {application.id})
                          </span>
                        </span>
                      ),
                    }))}
                    value={value}
                    error={emptyApplicationsError ?? errors.config?.defaultApplicationId?.message}
                    onChange={onChange}
                  />
                )}
              />
            </FormField>
            <FormField title="enterprise_sso_details.idp_initiated_auth_config.authentication_type">
              <Controller
                control={control}
                name="config.autoSendAuthorizationRequest"
                render={({ field: { value, onChange } }) => (
                  <RadioGroup
                    className={styles.radioGroup}
                    name="autoSendAuthorizationRequest"
                    value={value ? 'true' : 'false'}
                    type="card"
                    onChange={(value: string) => {
                      onChange(value === 'true');
                    }}
                  >
                    {[false, true].map((value) => (
                      <Radio
                        key={String(value)}
                        className={styles.radioElement}
                        value={String(value)}
                        isDisabled={value && defaultApplication?.type === ApplicationType.SPA}
                      >
                        <div className={styles.radioCardTitle}>
                          {t(
                            `enterprise_sso_details.idp_initiated_auth_config.auto_authentication_${
                              value ? 'enabled' : 'disabled'
                            }_title`
                          )}
                        </div>
                        <div className={styles.radioCardBody}>
                          {t(
                            `enterprise_sso_details.idp_initiated_auth_config.auto_authentication_${
                              value ? 'enabled' : 'disabled'
                            }_description`
                          )}
                        </div>
                        <div className={styles.radioCardFooter}>
                          {t(
                            `enterprise_sso_details.idp_initiated_auth_config.auto_authentication_${
                              value ? 'enabled' : 'disabled'
                            }_app`
                          )}
                        </div>
                      </Radio>
                    ))}
                  </RadioGroup>
                )}
              />
            </FormField>
            {/** Client redirect flow */}
            {!autoSendAuthorizationRequest && (
              <FormField
                isRequired
                title="enterprise_sso_details.idp_initiated_auth_config.idp_initiated_auth_callback_uri"
                tip={t(
                  'enterprise_sso_details.idp_initiated_auth_config.idp_initiated_auth_callback_uri_tooltip'
                )}
              >
                <TextInput
                  {...register('config.clientIdpInitiatedAuthCallbackUri', {
                    required: t('errors.required_field_missing', {
                      field: t(
                        'enterprise_sso_details.idp_initiated_auth_config.idp_initiated_auth_callback_uri'
                      ),
                    }),
                    validate: (value) =>
                      !value || uriValidator(value) || t('errors.invalid_uri_format'),
                  })}
                  required
                  placeholder="Redirect URI"
                  error={errors.config?.clientIdpInitiatedAuthCallbackUri?.message}
                />
              </FormField>
            )}
            {/** IdP-initiated direct sign-in flow */}
            {autoSendAuthorizationRequest && (
              <>
                <FormField
                  isRequired
                  title="enterprise_sso_details.idp_initiated_auth_config.redirect_uri"
                  tip={t('enterprise_sso_details.idp_initiated_auth_config.redirect_uri_tooltip')}
                >
                  <Controller
                    control={control}
                    name="config.redirectUri"
                    rules={{
                      required: t('errors.required_field_missing', {
                        field: t('enterprise_sso_details.idp_initiated_auth_config.redirect_uri'),
                      }),
                    }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        options={defaultApplicationRedirectUris.map((uri) => ({
                          value: uri,
                          title: uri,
                        }))}
                        placeholder={t(
                          'enterprise_sso_details.idp_initiated_auth_config.redirect_uri_placeholder'
                        )}
                        value={value}
                        error={emptyRedirectUrisError ?? errors.config?.redirectUri?.message}
                        onChange={onChange}
                      />
                    )}
                  />
                </FormField>
                <FormField
                  title="enterprise_sso_details.idp_initiated_auth_config.auth_params"
                  tip={t('enterprise_sso_details.idp_initiated_auth_config.auth_params_tooltip')}
                >
                  <Controller
                    control={control}
                    name="config.authParameters"
                    defaultValue="{}"
                    render={({ field: { value, onChange } }) => (
                      <CodeEditor language="json" value={value} onChange={onChange} />
                    )}
                  />
                </FormField>
              </>
            )}
          </>
        )}
      </FormCard>
    </DetailsForm>
  );
}

export default ConfigForm;
