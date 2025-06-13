import { type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FormField from '@/ds-components/FormField';
import TextInput from '@/ds-components/TextInput';

import { type CaptchaProviderMetadata } from '../CreateCaptchaForm/types';
import { type CaptchaFormType } from '../types';

type Props = {
  readonly metadata: CaptchaProviderMetadata;
  readonly errors: FieldErrors;
  readonly register: UseFormRegister<CaptchaFormType>;
};

function CaptchaFormFields({ metadata, errors, register }: Props) {
  const siteKeyField = metadata.requiredFields.find((field) => field.field === 'siteKey');
  const secretKeyField = metadata.requiredFields.find((field) => field.field === 'secretKey');
  const projectIdField = metadata.requiredFields.find((field) => field.field === 'projectId');
  const scoreField = metadata.requiredFields.find((field) => field.field === 'scoreThreshold');
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });

  return (
    <>
      {siteKeyField && (
        <FormField isRequired title={siteKeyField.label}>
          <TextInput
            error={Boolean(errors.siteKey)}
            placeholder={String(t(siteKeyField.placeholder))}
            {...register('siteKey', { required: true })}
          />
        </FormField>
      )}
      {secretKeyField && (
        <FormField isRequired title={secretKeyField.label}>
          <TextInput
            error={Boolean(errors.secretKey)}
            placeholder={String(t(secretKeyField.placeholder))}
            {...register('secretKey', { required: true })}
          />
        </FormField>
      )}
      {projectIdField && (
        <FormField isRequired title={projectIdField.label}>
          <TextInput
            error={Boolean(errors.projectId)}
            placeholder={String(t(projectIdField.placeholder))}
            {...register('projectId', { required: true })}
          />
        </FormField>
      )}
      {scoreField && (
        <FormField isRequired title={scoreField.label}>
          <TextInput
            error={Boolean(errors.scoreThreshold)}
            type="number"
            step="0.1"
            min={0}
            max={1}
            placeholder={String(t(scoreField.placeholder))}
            {...register('scoreThreshold', { valueAsNumber: true, required: true })}
          />
        </FormField>
      )}
    </>
  );
}

export default CaptchaFormFields;
