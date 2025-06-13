import { ConnectorError, ConnectorErrorCodes, parseJson } from '@logto/connector-kit';
import { requestTokenEndpoint, TokenEndpointAuthMethod } from '@logto/connector-oauth';

import { defaultTimeout, scope } from './constant.js';
import { accessTokenResponseGuard } from './types.js';

export type GrantAccessTokenParameters = {
  tokenEndpoint: string;
  resource: string;
  appId: string;
  appSecret: string;
};

export const grantAccessToken = async ({
  tokenEndpoint,
  resource,
  appId,
  appSecret,
}: GrantAccessTokenParameters) => {
  const httpResponse = await requestTokenEndpoint({
    tokenEndpoint,
    tokenEndpointAuthOptions: { method: TokenEndpointAuthMethod.ClientSecretBasic },
    tokenRequestBody: {
      grantType: 'client_credentials',
      resource,
      scope: scope.join(' '),
      clientId: appId,
      clientSecret: appSecret,
    },
    timeout: defaultTimeout,
  });

  const result = accessTokenResponseGuard.safeParse(
    parseJson(await httpResponse.text())
  );

  if (!result.success) {
    throw new ConnectorError(ConnectorErrorCodes.InvalidResponse, result.error);
  }

  return result.data;
};
