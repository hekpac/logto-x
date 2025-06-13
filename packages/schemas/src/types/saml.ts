import { type SsoConnectorWithProviderConfig, type SsoProviderType } from './sso-connector.js';
import { z } from 'zod';

export type SamlSsoConnectorWithProviderConfig = Omit<SsoConnectorWithProviderConfig, 'providerType'> & {
  providerType: SsoProviderType.SAML;
};

const samlAttributeMappingGuard = z
  .object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  })
  .partial();

type SamlAttributeMapping = z.infer<typeof samlAttributeMappingGuard>;

export const samlAttributeKeys = Object.freeze(['id', 'email', 'name']) satisfies ReadonlyArray<
  keyof SamlAttributeMapping
>;

export const samlConnectorConfigGuard = z
  .object({
    metadataUrl: z.string(),
    metadata: z.string(),
    signInEndpoint: z.string(),
    entityId: z.string(),
    x509Certificate: z.string(),
    attributeMapping: samlAttributeMappingGuard,
  })
  .partial();

export type SamlConnectorConfig = z.infer<typeof samlConnectorConfigGuard>;

const samlServiceProviderMetadataGuard = z.object({
  entityId: z.string().min(1),
  assertionConsumerServiceUrl: z.string().min(1),
});

const samlIdentityProviderMetadataGuard = z.object({
  entityId: z.string(),
  signInEndpoint: z.string(),
  x509Certificate: z.string(),
  certificateExpiresAt: z.number(), // Timestamp in milliseconds.
  isCertificateValid: z.boolean(),
});

export const samlProviderConfigGuard = z.object({
  defaultAttributeMapping: samlAttributeMappingGuard,
  serviceProvider: samlServiceProviderMetadataGuard,
  identityProvider: samlIdentityProviderMetadataGuard.optional(),
});

export type SamlProviderConfig = z.infer<typeof samlProviderConfigGuard>;
