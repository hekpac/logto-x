import { InteractionEvent, MfaFactor } from '@logto/schemas';
import { t } from 'i18next';
import { useCallback, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';

import SecondaryPageLayout from '@/Layout/SecondaryPageLayout';
import SectionLayout from '@/Layout/SectionLayout';
import Button from '@/components/Button';
import { InputField } from '@/components/InputFields';
import SwitchMfaFactorsLink from '@/components/SwitchMfaFactorsLink';
import useMfaFlowState from '@/hooks/use-mfa-factors-state';
import useErrorHandler from '@/hooks/use-error-handler';
import useSendMfaPayload from '@/hooks/use-send-mfa-payload';
import useSubmitInteractionErrorHandler from '@/hooks/use-submit-interaction-error-handler';
import ErrorPage from '@/pages/ErrorPage';
import { UserMfaFlow } from '@/types';

import styles from './index.module.scss';

type FormState = {
  code: string;
};

const BackupCodeVerification = () => {
  const flowState = useMfaFlowState();
  const sendMfaPayload = useSendMfaPayload();
  const handleError = useErrorHandler();
  const preSignInErrorHandler = useSubmitInteractionErrorHandler(InteractionEvent.SignIn, {
    replace: true,
  });
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormState>({ defaultValues: { code: '' } });

  const onSubmitHandler = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      void handleSubmit(async ({ code }) => {
        const [error] = await sendMfaPayload({
          flow: UserMfaFlow.MfaVerification,
          payload: { type: MfaFactor.BackupCode, code },
        });

        if (error) {
          await handleError(error, preSignInErrorHandler);
        }
      })(event);
    },
    [handleError, handleSubmit, preSignInErrorHandler, sendMfaPayload]
  );

  if (!flowState) {
    return <ErrorPage title="error.invalid_session" />;
  }

  return (
    <SecondaryPageLayout title="mfa.verify_mfa_factors">
      <SectionLayout
        title="mfa.enter_a_backup_code"
        description="mfa.enter_backup_code_description"
      >
        <form onSubmit={onSubmitHandler}>
          <InputField
            autoComplete="off"
            label={t('input.backup_code')}
            className={styles.backupCodeInput}
            {...register('code')}
          />
          <Button title="action.continue" htmlType="submit" isLoading={isSubmitting} />
        </form>
      </SectionLayout>
      <SwitchMfaFactorsLink
        flow={UserMfaFlow.MfaVerification}
        flowState={flowState}
        className={styles.switchFactorLink}
      />
    </SecondaryPageLayout>
  );
};

export default BackupCodeVerification;
