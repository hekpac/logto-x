import { emailRegEx } from '@logto/core-kit';
import { generateStandardShortId } from '@logto/shared/universal';
import { conditional } from '@silverhand/essentials';
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

  const handleChange = (nextValues: InviteeEmailItem[]) => {
    const { values: parsedValues, errorMessage } = parseEmailOptions(nextValues);
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
      valueClassName={(option) => option.status ? styles[option.status] : undefined}
      getId={(option) => option.id}
      renderValue={(option) => option.value}
      validateInput={(text) => {
        const item: InviteeEmailItem = {
          id: generateStandardShortId(),
          value: text,
          ...conditional(!emailRegEx.test(text) && { status: 'error' }),
        };
        const { errorMessage } = parseEmailOptions([...values, item]);
        if (errorMessage) {
          return errorMessage;
        }
        return { value: item };
      }}
      placeholder={placeholder}
      error={error}
      onChange={handleChange}
      onError={(err) => {
        setError(formName, { type: 'custom', message: err });
      }}
      onClearError={() => {
        clearErrors(formName);
      }}
    />
  );
}

export default InviteEmailsInput;
