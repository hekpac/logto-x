import { generateStandardShortId } from '@logto/shared/universal';
import classNames from 'classnames';
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
    <MultiOptionInput
      className={classNames(styles.input, Boolean(error) && styles.error, className)}
      values={values}
      getId={(option) => option.id}
      renderValue={(option) => option.value}
      valueClassName={(option) => (option.status ? styles[option.status] : undefined)}
      validateInput={(text) => ({ value: { id: generateStandardShortId(), value: text } })}
      placeholder={placeholder}
      error={error}
      onChange={handleChange}
    />
  );
}

export default InviteEmailsInput;
