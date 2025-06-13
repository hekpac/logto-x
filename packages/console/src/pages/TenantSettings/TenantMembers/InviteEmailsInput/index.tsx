import { generateStandardShortId } from '@logto/shared/universal';
 <<<<<<< 4cwnwj-codex/reemplazar-componente-de-email-por-multioptioninput
=======
 <<<<<<< codex/reemplazar-componente-de-email-por-multioptioninput
import { conditional } from '@silverhand/essentials';
=======
 <<<<<<< gwbyv4-codex/reemplazar-componente-de-email-con-multioptioninput
import classNames from 'classnames';
import { useCallback } from 'react';
=======
 <<<<<<< codex/sustituir-componente-email-por-multioptioninput
import { conditional } from '@silverhand/essentials';
=======
 <<<<<<< codex/reemplazar-componente-de-correo-personalizado
import classNames from 'classnames';
=======
 <<<<<<< sst8jf-codex/reemplazar-componente-de-email-con-multioptioninput
import { conditional } from '@silverhand/essentials';
=======
 <<<<<<< codex/reemplazar-componente-de-email-con-multioptioninput
=======
import { conditional } from '@silverhand/essentials';
import { useCallback } from 'react';
 >>>>>>> master
 >>>>>>> master
 >>>>>>> master
 >>>>>>> master
 >>>>>>> master
 >>>>>>> master
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
 <<<<<<< sst8jf-codex/reemplazar-componente-de-email-con-multioptioninput
=======
  /**
   * Function to check for duplicated or invalid email addresses. It should return
   * valid email addresses and an error message if any.
   */
 >>>>>>> master
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
 <<<<<<< 4cwnwj-codex/reemplazar-componente-de-email-por-multioptioninput

  const handleChange = (nextValues: InviteeEmailItem[]) => {
    const { values: parsedValues, errorMessage } = parseEmailOptions(nextValues);
=======
 <<<<<<< codex/reemplazar-componente-de-email-por-multioptioninput

  const handleChange = (newValues: InviteeEmailItem[]) => {
    const { values: parsedValues, errorMessage } = parseEmailOptions(newValues);
=======
 <<<<<<< gwbyv4-codex/reemplazar-componente-de-email-con-multioptioninput

  const onChange = useCallback(
    (inputValues: InviteeEmailItem[]) => {
      const { values: parsedValues, errorMessage } = parseEmailOptions(inputValues);
 >>>>>>> master

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
=======
 <<<<<<< codex/sustituir-componente-email-por-multioptioninput

  const handleChange = (newValues: InviteeEmailItem[]) => {
    const { values: parsedValues, errorMessage } = parseEmailOptions(newValues);
=======
 <<<<<<< codex/reemplazar-componente-de-correo-personalizado

  const handleChange = (nextValues: InviteeEmailItem[]) => {
    const { values: parsedValues, errorMessage } = parseEmailOptions(nextValues);
=======
 <<<<<<< sst8jf-codex/reemplazar-componente-de-email-con-multioptioninput
=======

 <<<<<<< codex/reemplazar-componente-de-email-con-multioptioninput
  const handleChange = (newValues: InviteeEmailItem[]) => {
    const { values: parsedValues, errorMessage } = parseEmailOptions(newValues);
 >>>>>>> master
  >>>>>>> master
 >>>>>>> master
 >>>>>>> master

  const handleChange = (nextValues: InviteeEmailItem[]) => {
    const { values: parsedValues, errorMessage } = parseEmailOptions(nextValues);
    if (errorMessage) {
      setError(formName, { type: 'custom', message: errorMessage });
    } else {
      clearErrors(formName);
    }
 <<<<<<< sst8jf-codex/reemplazar-componente-de-email-con-multioptioninput
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
=======

    rawOnChange(parsedValues);
  };
 <<<<<<< codex/sustituir-componente-email-por-multioptioninput
=======
 <<<<<<< codex/reemplazar-componente-de-correo-personalizado

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
=======

  return (
    <MultiOptionInput<InviteeEmailItem>
      className={className}
      values={values}
 <<<<<<< codex/reemplazar-componente-de-email-por-multioptioninput
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
=======
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

 <<<<<<< 4cwnwj-codex/reemplazar-componente-de-email-por-multioptioninput
  const validateInput = (text: string): { value: InviteeEmailItem } | string => {
    const newValue: InviteeEmailItem = { id: generateStandardShortId(), value: text };
    const { errorMessage } = parseEmailOptions([...values, newValue]);

    return errorMessage ?? { value: newValue };
  };

  return (
    <MultiOptionInput<InviteeEmailItem>
      className={className}
      values={values}
      renderValue={(option) => option.value}
      valueClassName={(option) => (option.status ? styles[option.status] : undefined)}
      validateInput={validateInput}
      placeholder={placeholder}
      error={error}
      onChange={handleChange}
      onError={(message) => {
        setError(formName, { type: 'custom', message });
=======
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
 >>>>>>> master

  return (
    <MultiOptionInput
      className={className}
      values={values}
 <<<<<<< codex/sustituir-componente-email-por-multioptioninput
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
=======
      getId={(option) => option.id}
      renderValue={(option) => option.value}
      valueClassName={(option) => option.status && styles[option.status]}
      placeholder={placeholder}
 >>>>>>> master
      onChange={handleChange}
      onError={(message) => {
        setError(formName, { type: 'custom', message });
 >>>>>>> master
 >>>>>>> master
 >>>>>>> master
      }}
      onClearError={() => {
        clearErrors(formName);
      }}
 <<<<<<< 4cwnwj-codex/reemplazar-componente-de-email-por-multioptioninput
=======
 <<<<<<< codex/reemplazar-componente-de-email-por-multioptioninput
=======
 <<<<<<< sst8jf-codex/reemplazar-componente-de-email-con-multioptioninput
=======
 <<<<<<< codex/reemplazar-componente-de-email-con-multioptioninput
=======
      validateInput={validateInput}
      error={error}
 >>>>>>> master
 >>>>>>> master
 >>>>>>> master
 >>>>>>> master
 >>>>>>> master
 >>>>>>> master
 >>>>>>> master
    />
  );
}

export default InviteEmailsInput;
