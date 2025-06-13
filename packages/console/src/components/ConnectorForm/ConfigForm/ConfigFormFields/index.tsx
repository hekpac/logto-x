import type { ConnectorConfigFormItem, I18nPhrases } from '@logto/connector-kit';
import { ConnectorConfigFormItemType } from '@logto/connector-kit';
import { useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { CheckboxGroup } from '@/ds-components/Checkbox';
import CodeEditor from '@/ds-components/CodeEditor';
import FormField from '@/ds-components/FormField';
import Select from '@/ds-components/Select';
import Switch from '@/ds-components/Switch';
import TextInput from '@/ds-components/TextInput';
import Textarea from '@/ds-components/Textarea';
import type { ConnectorFormType } from '@/types/connector';
import { jsonValidator } from '@/utils/validator';
import { getLocaleString, isKeyOfI18nPhrases } from '@/utils/translation';

import styles from './index.module.scss';

type Props = {
  readonly formItems: ConnectorConfigFormItem[];
};

function ConfigFormFields({ formItems }: Props) {
  const {
    watch,
    register,
    control,
    formState: {
      errors: { formConfig: formConfigErrors },
    },
  } = useFormContext<ConnectorFormType>();
  const { t, i18n } = useTranslation(undefined, { keyPrefix: 'admin_console' });

  const translate = useCallback(
    (value?: string | I18nPhrases) => {
      if (!value) {
        return undefined;
      }

      return typeof value === 'string' ? t(value) : getLocaleString(i18n.language, value);
    },
    [t, i18n.language]
  );

  const values = watch('formConfig');

  const showFormItems = useCallback(
    (formItem: ConnectorConfigFormItem) => {
      if (!formItem.showConditions) {
        return true;
      }

      return formItem.showConditions.every(({ expectValue, targetKey }) => {
        const targetValue = values[targetKey];

        return targetValue === expectValue;
      });
    },
    [values]
  );

  const renderFormItem = (item: ConnectorConfigFormItem) => {
    const errorMessage = formConfigErrors?.[item.key]?.message;
    const error =
      typeof errorMessage === 'string' && errorMessage.length > 0
        ? errorMessage
        : Boolean(formConfigErrors?.[item.key]);

    const buildCommonProperties = () => ({
      ...register(`formConfig.${item.key}`, {
        required: item.required,
        valueAsNumber: item.type === ConnectorConfigFormItemType.Number,
      }),
      placeholder: translate(item.placeholder),
      error,
    });

    if (item.type === ConnectorConfigFormItemType.Text) {
      return (
        <TextInput
          {...buildCommonProperties()}
          isConfidential={item.isConfidential}
        />
      );
    }

    if (item.type === ConnectorConfigFormItemType.MultilineText) {
      return <Textarea rows={5} {...buildCommonProperties()} />;
    }

    if (item.type === ConnectorConfigFormItemType.Number) {
      return <TextInput type="number" {...buildCommonProperties()} />;
    }

    return (
      <Controller
        name={`formConfig.${item.key}`}
        control={control}
        rules={{
          // For switch, "false" will be treated as an empty value, so we need to set required to false.
          required: item.type === ConnectorConfigFormItemType.Switch ? false : item.required,
          validate:
            item.type === ConnectorConfigFormItemType.Json
              ? (value) =>
                  (typeof value === 'string' && jsonValidator(value)) ||
                  t('errors.invalid_json_format')
              : undefined,
        }}
        render={({ field: { onChange, value } }) => {
          if (item.type === ConnectorConfigFormItemType.Switch) {
            return (
              <Switch
                label={translate(item.label)}
                checked={typeof value === 'boolean' ? value : false}
                onChange={({ currentTarget: { checked } }) => {
                  onChange(checked);
                }}
              />
            );
          }

          if (item.type === ConnectorConfigFormItemType.Select) {
            return (
              <Select
                options={item.selectItems.map(({ value, title }) => ({
                  value,
                  title: translate(title),
                }))}
                value={typeof value === 'string' ? value : undefined}
                error={error}
                onChange={onChange}
              />
            );
          }

          if (item.type === ConnectorConfigFormItemType.MultiSelect) {
            return (
              <CheckboxGroup
                options={item.selectItems.map(({ value, title }) => ({
                  value,
                  title: title ? translate(title) : undefined,
                }))}
                value={
                  Array.isArray(value) &&
                  value.every((item): item is string => typeof item === 'string')
                    ? value
                    : []
                }
                className={styles.multiSelect}
                onChange={onChange}
              />
            );
          }

          if (item.type === ConnectorConfigFormItemType.Json) {
            return (
              <CodeEditor
                language="json"
                error={error}
                value={typeof value === 'string' ? value : '{}'}
                onChange={onChange}
              />
            );
          }

          // Default (unknown) type is "Text"
          // This will happen when connector's version is ahead of AC
          return (
            <TextInput
              error={error}
              value={typeof value === 'string' ? value : ''}
              onChange={onChange}
            />
          );
        }}
      />
    );
  };

  return (
    <>
      {formItems.map((item) =>
        showFormItems(item) ? (
          <FormField
            key={item.key}
            isRequired={item.required}
            tip={translate(item.tooltip)}
            title={item.type !== ConnectorConfigFormItemType.Switch ? translate(item.label) : undefined}
          >
            {renderFormItem(item)}
            {Boolean(item.description) && (
              <div className={styles.description}>{translate(item.description)}</div>
            )}
          </FormField>
        ) : null
      )}
    </>
  );
}

export default ConfigFormFields;
