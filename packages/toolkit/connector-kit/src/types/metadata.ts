import { type Nullable } from '@silverhand/essentials';
import { z } from 'zod';

import { connectorConfigFormItemGuard } from './config-form.js';
import { type ToZodObject } from './foundation.js';
import { type I18nPhrases, i18nPhrasesGuard } from './i18n.js';

export enum ConnectorPlatform {
  Native = 'Native',
  Universal = 'Universal',
  Web = 'Web',
}

export type SocialConnectorMetadata = {
  platform?: ConnectorPlatform;
  isStandard?: boolean;
};

export const socialConnectorMetadataGuard = z.object({
  // Social connector platform.
  platform: z.nativeEnum(ConnectorPlatform).optional(),
  // Indicates custom connector that follows standard protocol. Currently supported standard connectors are OIDC, OAuth2, and SAML2
  isStandard: z.boolean().optional(),
}) satisfies ToZodObject<SocialConnectorMetadata>;

export type ConnectorMetadata = {
  id: string;
  target: string;
  name: I18nPhrases;
  description: I18nPhrases;
  logo: string;
  logoDark: Nullable<string>;
  readme: string;
  configTemplate?: string;
  formItems?: Array<z.infer<typeof connectorConfigFormItemGuard>>;
  customData?: Record<string, unknown>;
  /** @deprecated Use `customData` instead. */
  fromEmail?: string;
} & SocialConnectorMetadata;

export const connectorMetadataGuard = z
  .object({
    // Unique connector factory id
    id: z.string(),
    /* Connector provider. Unique for each provider. Users can have only one social identity per provider
      For Social connectors, it's manually set on connector creation
      For SSO connectors, it's the same as the issuer 
    */
    target: z.string(),
    name: i18nPhrasesGuard,
    description: i18nPhrasesGuard,
    logo: z.string(),
    logoDark: z.string().nullable(),
    readme: z.string(),
    configTemplate: z.string().optional(), // Connector config template
    formItems: connectorConfigFormItemGuard.array().optional(),
    customData: z.record(z.unknown()).optional(),
    fromEmail: z.string().optional(),
  })
  .merge(socialConnectorMetadataGuard) satisfies ToZodObject<ConnectorMetadata>;

// Configurable connector metadata guard. Stored in DB metadata field
export const configurableConnectorMetadataGuard = connectorMetadataGuard
  .pick({
    target: true,
    name: true,
    logo: true,
    logoDark: true,
  })
  .partial();

export type ConfigurableConnectorMetadata = z.infer<typeof configurableConnectorMetadataGuard>;
