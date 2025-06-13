import { type AdminConsoleKey } from '@logto/phrases';
import { generateStandardShortId } from '@logto/shared/universal';
import { conditional } from '@silverhand/essentials';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import MultiOptionInput from '@/components/MultiOptionInput';

import { domainRegExp } from './consts';
import styles from './index.module.scss';
import { domainOptionsParser, type Option } from './utils';

export type DomainsFormType = {
  domains: Option[];
};

type Props = {
  readonly className?: string;
  readonly values: Option[];
  readonly onChange: (values: Option[]) => void;
  readonly error?: string | boolean;
  readonly placeholder?: AdminConsoleKey;
};

function DomainsInput({ className, values, onChange: rawOnChange, error, placeholder }: Props) {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { setError, clearErrors } = useFormContext<DomainsFormType>();

  const onChange = (options: Option[]) => {
    const { values: parsedValues, errorMessage } = domainOptionsParser(options);

    if (errorMessage) {
      setError('domains', { type: 'custom', message: errorMessage });
    } else {
      clearErrors('domains');
    }

    rawOnChange(parsedValues);
  };

  return (
    <MultiOptionInput
      className={className}
      values={values}
      getId={(option) => option.id}
      valueClassName={(option) => (option.status ? styles[option.status] : '')}
      renderValue={(option) => option.value}
      validateInput={(input) => ({
        value: {
          value: input,
          id: generateStandardShortId(),
          ...conditional(!domainRegExp.test(input) && { status: 'info' }),
        },
      })}
      placeholder={conditional(values.length === 0 && placeholder && String(t(placeholder)))}
      error={error}
      onChange={onChange}
      onError={(message) => {
        setError('domains', { type: 'custom', message });
      }}
      onClearError={() => {
        clearErrors('domains');
      }}
    />
  );
}

export default DomainsInput;
