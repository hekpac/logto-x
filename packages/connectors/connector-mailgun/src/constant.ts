import type { ConnectorMetadata } from '@logto/connector-kit';
import { ConnectorConfigFormItemType } from '@logto/connector-kit';

export const endpoint = 'https://api.sendgrid.com/v3/mail/send';

export const defaultMetadata: ConnectorMetadata = {
  id: 'mailgun-email',
  target: 'mailgun-email',
  name: {
    en: 'Mailgun',
  },
  logo: './logo.png',
  logoDark: null,
  description: {
    en: 'Mailgun is an email delivery service for sending, receiving, and tracking emails.',
  },
  readme: './README.md',
  formItems: [
    {
      key: 'endpoint',
      label: 'Mailgun endpoint',
      type: ConnectorConfigFormItemType.Text,
      required: false,
      placeholder: 'https://api.mailgun.net',
    },
    {
      key: 'domain',
      label: 'Domain',
      type: ConnectorConfigFormItemType.Text,
      required: true,
      placeholder: 'your-mailgun-domain.com',
    },
    {
      key: 'apiKey',
      label: 'API Key',
      type: ConnectorConfigFormItemType.Text,
      required: true,
      isConfidential: true,
      placeholder: '<your-mailgun-api-key>',
    },
    {
      key: 'from',
      label: 'Email address to send from',
      type: ConnectorConfigFormItemType.Text,
      required: true,
      placeholder: 'Sender Name <foo@example.com>',
    },
    {
      key: 'deliveries',
      label: 'Deliveries',
      type: ConnectorConfigFormItemType.Json,
      required: true,
      defaultValue: {
        SignIn: {
          subject: 'Logto sign-in template {{code}}',
          html: 'Your Logto sign-in verification code is {{code}}. The code will remain active for 10 minutes.',
        },
        Register: {
          subject: 'Logto sign-up template {{code}}',
          html: 'Your Logto sign-up verification code is {{code}}. The code will remain active for 10 minutes.',
        },
        ForgotPassword: {
          subject: 'Logto reset password template {{code}}',
          html: 'Your Logto reset password verification code is {{code}}. The code will remain active for 10 minutes.',
        },
        Generic: {
          subject: 'Logto generic template {{code}}',
          html: 'Your Logto generic verification code is {{code}}. The code will remain active for 10 minutes.',
        },
      },
    },
  ],
};
