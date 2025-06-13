import { generateStandardShortId } from '@logto/shared/universal';
 <<<<<<< codex/reemplazar-componente-de-email-con-multioptioninput
=======
import { conditional } from '@silverhand/essentials';
import { useCallback } from 'react';
 >>>>>>> master
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

 <<<<<<< codex/reemplazar-componente-de-email-con-multioptioninput
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
=======
  const handleChange = useCallback(
    (nextValues: InviteeEmailItem[]) => {
      const { values: parsedValues, errorMessage } = parseEmailOptions(nextValues);

      if (errorMessage) {
        setError(formName, { type: 'custom', message: errorMessage });
        return;
      }

      clearErrors(formName);
      rawOnChange(parsedValues);
    },
    [parseEmailOptions, rawOnChange, formName, setError, clearErrors]
  );

  const validateInput = useCallback(
    (text: string) => {
      const newValue: InviteeEmailItem = {
        value: text,
        id: generateStandardShortId(),
        ...conditional(!emailRegEx.test(text) && { status: 'error' }),
      };

      const { errorMessage } = parseEmailOptions([...values, newValue]);
      if (errorMessage) {
        return errorMessage;
      }

      return { value: newValue };
    },
    [parseEmailOptions, values]
  );

  return (
    <MultiOptionInput
      className={className}
      values={values}
      getId={(option) => option.id}
      renderValue={(option) => option.value}
      valueClassName={(option) => option.status && styles[option.status]}
      placeholder={placeholder}
 >>>>>>> master
      onChange={handleChange}
      onError={(message) => {
        setError(formName, { type: 'custom', message });
      }}
      onClearError={() => {
        clearErrors(formName);
      }}
 <<<<<<< codex/reemplazar-componente-de-email-con-multioptioninput
=======
      validateInput={validateInput}
      error={error}
 >>>>>>> master
    />
  );
}

export default InviteEmailsInput;
