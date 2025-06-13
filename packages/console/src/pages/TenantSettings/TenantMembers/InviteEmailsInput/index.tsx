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
    <MultiOptionInput<InviteeEmailItem>
      className={className}
      values={values}
      getId={(value) => value.id}
      valueClassName={(option) => (option.status ? styles[option.status] : undefined)}
      renderValue={(option) => option.value}
      placeholder={placeholder}
      error={error}
      validateInput={(input) => {
        const item: InviteeEmailItem = {
          value: input,
          id: generateStandardShortId(),
          ...conditional(!emailRegEx.test(input) && { status: 'error' }),
        };

        const { errorMessage } = parseEmailOptions([...values, item]);

        return errorMessage ?? { value: item };
      }}
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
