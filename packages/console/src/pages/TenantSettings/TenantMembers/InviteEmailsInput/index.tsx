import { emailRegEx } from '@logto/core-kit';
import { generateStandardShortId } from '@logto/shared/universal';
import { conditional } from '@silverhand/essentials';
import { useFormContext } from 'react-hook-form';

import MultiOptionInput from '@/components/MultiOptionInput';

import type { InviteeEmailItem } from '../types';

import styles from './index.module.scss';

type Props = {
  readonly formName?: string;
  readonly className?: string;
  readonly values: InviteeEmailItem[];
  readonly onChange: (values: InviteeEmailItem[]) => void;
  readonly error?: string | boolean;
  readonly placeholder?: string;
  /**
   * Function to check for duplicated or invalid email addresses. It should return valid email addresses
   * and an error message if any.
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
    <MultiOptionInput
      className={className}
      values={values}
      placeholder={placeholder}
      error={error}
      onChange={handleChange}
      getId={(item) => item.id}
      renderValue={(item) => item.value}
      valueClassName={(item) => item.status && styles[item.status]}
      validateInput={(text) => ({
        value: {
          value: text,
          id: generateStandardShortId(),
          ...conditional(!emailRegEx.test(text) && { status: 'error' }),
        },
      })}
    />
  );
}

export default InviteEmailsInput;
