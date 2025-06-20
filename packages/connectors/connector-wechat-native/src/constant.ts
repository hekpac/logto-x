import type { ConnectorMetadata } from '@logto/connector-kit';
import { ConnectorPlatform, ConnectorConfigFormItemType } from '@logto/connector-kit';

export const authorizationEndpoint = 'wechat://'; // This is used to arouse the native WeChat App
export const accessTokenEndpoint = 'https://api.weixin.qq.com/sns/oauth2/access_token';
export const userInfoEndpoint = 'https://api.weixin.qq.com/sns/userinfo';
export const scope = 'snsapi_userinfo';

// See https://developers.weixin.qq.com/doc/oplatform/Return_codes/Return_code_descriptions_new.html to know more about WeChat response error code
export const invalidAuthCodeErrcode = [40_029, 40_163, 42_003];

export const invalidAccessTokenErrcode = [40_001, 40_014];

export const defaultMetadata: ConnectorMetadata = {
  id: 'wechat-native',
  target: 'wechat',
  platform: ConnectorPlatform.Native,
  name: {
    en: 'WeChat',
    'zh-CN': '微信',
    'tr-TR': 'WeChat',
    ko: 'WeChat',
  },
  logo: './logo.svg',
  logoDark: null,
  description: {
    en: 'WeChat is a cross-platform instant messaging app.',
    'zh-CN': '微信是一款跨平台的即时通讯软件。',
    'tr-TR': 'WeChat, çoklu platformda kullanılabilen bir anlık mesajlaşma uygulamasıdır.',
    ko: 'WeChat은 크로스 플랫폼 메시징 앱입니다.',
  },
  readme: './README.md',
  formItems: [
    {
      key: 'appId',
      label: 'App ID',
      required: true,
      type: ConnectorConfigFormItemType.Text,
      placeholder: '<app-id>',
    },
    {
      key: 'appSecret',
      label: 'App Secret',
      required: true,
      isConfidential: true,
      type: ConnectorConfigFormItemType.Text,
      placeholder: '<app-secret>',
    },
    {
      key: 'universalLinks',
      label: 'Universal Links',
      required: false,
      type: ConnectorConfigFormItemType.Text,
      placeholder: '<universal-links>',
    },
  ],
};

export const defaultTimeout = 5000;
