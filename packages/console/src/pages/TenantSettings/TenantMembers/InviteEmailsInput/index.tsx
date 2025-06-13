import { generateStandardShortId } from '@logto/shared/universal';
import { useFormContext } from 'react-hook-form';

import MultiOptionInput from '@/components/MultiOptionInput';

import type { InviteeEmailItem } from '../types';

import styles from './index.module.scss';

export type Props = {
  readonly formName?: string;
  readonly className?: string;
  readonly values: InviteeEmailItem[];
  readonly onChange: (values: InviteeEmailItem[]) => void;
  readonly error?: string | boolean;
  readonly placeholder?: string;
  /**
   * Function to check for duplicated or invalid email addresses. It should return
   * valid email addresses and an error message if any.
   */
  readonly parseEmailOptions: (values: InviteeEmailItem[]) => {
    values: InviteeEmailItem[];
    errorMessage?: string;
  };
};

function InviteEmailsInput({
  formName = 'emails',
  className,
  values,
  onChange: rawOnChange,
  error,
  placeholder,
  parseEmailOptions,
}: Props) {
  const { setError, clearErrors } = useFormContext();

  const handleChange = (newValues: InviteeEmailItem[]) => {
    const { values: parsedValues, errorMessage } = parseEmailOptions(newValues);

    if (errorMessage) {
      setError(formName, { type: 'custom', message: errorMessage });
    } else {
      clearErrors(formName);
    }

    rawOnChange(parsedValues);
  };

  return (
    <MultiOptionInput<InviteeEmailItem>
      className={className}
      values={values}
      renderValue={(option) => option.value}
      valueClassName={(option) => option.status && styles[option.status]}
      validateInput={(input) => {
        const { errorMessage } = parseEmailOptions([
          ...values,
          { value: input, id: generateStandardShortId() },
        ]);
        if (errorMessage) {
          return errorMessage;
        }
        return { value: { id: generateStandardShortId(), value: input } };
      }}
      placeholder={placeholder}
      error={error}
      onChange={handleChange}
      onError={(message) => {
        setError(formName, { type: 'custom', message });
      }}
      onClearError={() => {
        clearErrors(formName);
      }}
    />
  );
}

export default InviteEmailsInput;
