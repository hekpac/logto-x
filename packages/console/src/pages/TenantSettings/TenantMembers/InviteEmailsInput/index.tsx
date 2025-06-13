import { generateStandardShortId } from '@logto/shared/universal';
import classNames from 'classnames';
import { useCallback } from 'react';
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

  const onChange = useCallback(
    (inputValues: InviteeEmailItem[]) => {
      const { values: parsedValues, errorMessage } = parseEmailOptions(inputValues);

      if (errorMessage) {
        setError(formName, { type: 'custom', message: errorMessage });
      } else {
        clearErrors(formName);
      }

      rawOnChange(parsedValues);
    },
    [parseEmailOptions, rawOnChange, formName, setError, clearErrors]
  );

  return (
    <MultiOptionInput<InviteeEmailItem>
      className={classNames(styles.input, className)}
      values={values}
      getId={(value) => value.id}
      renderValue={(value) => value.value}
      valueClassName={(value) => value.status && styles[value.status]}
      validateInput={(input) => ({ value: { id: generateStandardShortId(), value: input } })}
      placeholder={placeholder}
      error={error}
      onChange={onChange}
    />
  );
}

export default InviteEmailsInput;
