import { type SsoProviderType, type SsoConnectorWithProviderConfig } from './sso-connector.js';
import { z } from 'zod';

export type OidcSsoConnectorWithProviderConfig = Omit<SsoConnectorWithProviderConfig, 'providerType'> & {
  providerType: SsoProviderType.OIDC;
};

export const oidcConnectorConfigGuard = z
  .object({
    clientId: z.string(),
    clientSecret: z.string(),
    issuer: z.string(),
    scope: z.string().optional(),
    // The following fields are only available for EntraID (OIDC) connector
    trustUnverifiedEmail: z.boolean().optional(),
  })
  .partial();

export type OidcConnectorConfig = z.infer<typeof oidcConnectorConfigGuard>;

export const oidcProviderConfigGuard = z.object({
  authorizationEndpoint: z.string(),
  tokenEndpoint: z.string(),
  userinfoEndpoint: z.string(),
  jwksUri: z.string(),
  issuer: z.string(),
});

export type OidcProviderConfig = z.infer<typeof oidcProviderConfigGuard>;
