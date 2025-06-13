import type { Role, Application } from '@logto/schemas';
import { ApplicationType, InternalRole } from '@logto/schemas';
import { conditional } from '@silverhand/essentials';
import { z } from 'zod';

import { buildOidcClientMetadata } from '#src/oidc/utils.js';

export const includesInternalAdminRole = (roles: Readonly<Array<{ role: Role }>>) =>
  roles.some(({ role: { name } }) => name === InternalRole.Admin);

export const parseIsThirdPartQueryParam = (isThirdPartyQuery: 'true' | 'false' | undefined) => {
  if (isThirdPartyQuery === undefined) {
    return;
  }

  return isThirdPartyQuery === 'true';
};

export const hideOidcClientMetadataForSamlApp = (application: Application) => {
  return {
    ...application,
    ...conditional(
      application.type === ApplicationType.SAML && {
        oidcClientMetadata: buildOidcClientMetadata(),
      }
    ),
  };
};

export const hideOidcClientMetadataForSamlApps = (applications: readonly Application[]) => {
  return applications.map((application) => hideOidcClientMetadataForSamlApp(application));
};

export const applicationTypeGuard = z.nativeEnum(ApplicationType);
