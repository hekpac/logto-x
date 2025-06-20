import type { ConnectorMetadata } from '@logto/connector-kit';
import { ConnectorConfigFormItemType } from '@logto/connector-kit';

export const endpoint = 'https://sms.yunpian.com/v2/sms/single_send.json';

export const defaultMetadata: ConnectorMetadata = {
  id: 'yunpian-sms',
  target: 'yunpian-sms',
  name: {
    en: 'YunPian SMS Service',
    zh: '云片短信服务',
  },
  logo: './logo.svg',
  logoDark: null,
  description: {
    en: 'YunPian is a SMS service provider.',
    zh: '云片网是一家短信服务提供商。',
  },
  readme: './README.md',
  formItems: [
    {
      key: 'apikey',
      label: 'API Key',
      type: ConnectorConfigFormItemType.Text,
      required: true,
      placeholder: '<api-key>',
    },
    {
      key: 'templates',
      label: 'SMS Template',
      type: ConnectorConfigFormItemType.Json,
      required: true,
      defaultValue: [
        {
          usageType: 'SignIn',
          content: '您的验证码是 {{code}}。如非本人操作，请忽略本短信',
        },
        {
          usageType: 'Register',
          content: '您的验证码是 {{code}}。如非本人操作，请忽略本短信',
        },
        {
          usageType: 'ForgotPassword',
          content: '您的验证码是 {{code}}。如非本人操作，请忽略本短信',
        },
        {
          usageType: 'Generic',
          content: '您的验证码是 {{code}}。如非本人操作，请忽略本短信',
        },
      ],
    },
    {
      key: 'enableInternational',
      label: 'Enable International SMS',
      description:
        '* To enable it, you need to apply for international templates at the same time.',
      type: ConnectorConfigFormItemType.Switch,
      required: false,
      defaultValue: false,
    },
    {
      key: 'unsupportedCountriesMsg',
      label: 'Unsupported Countries Error Message',
      description:
        'The message to be displayed when the phone number is not supported. If left empty, no error will be returned.',
      type: ConnectorConfigFormItemType.Text,
      required: false,
      defaultValue: 'The administrator has not enabled international SMS services.',
    },
  ],
};
