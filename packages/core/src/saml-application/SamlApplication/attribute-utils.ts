import { userClaims, type UserClaim, UserScope, ReservedScope } from '@logto/core-kit';
import { NameIdFormat, type SamlAttributeMapping } from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import saml from 'samlify';

import {
  samlLogInResponseTemplate,
  samlAttributeNameFormatBasic,
  samlValueXmlnsXsi,
  fallbackAttributes,
} from './consts.js';
import { buildSamlAssertionNameId, generateSamlAttributeTag } from './utils.js';
import assertThat from '#src/utils/assert-that.js';
import type { IdTokenProfileStandardClaims } from '#src/sso/types/oidc.js';

export const buildLoginResponseTemplate = (
  attributeMapping: SamlAttributeMapping
) => ({
  context: samlLogInResponseTemplate,
  attributes: (Object.entries(attributeMapping).length > 0
    ? Object.values(attributeMapping)
    : fallbackAttributes
  ).map((value) => ({
    name: value,
    valueTag: value,
    nameFormat: samlAttributeNameFormatBasic,
    valueXsiType: samlValueXmlnsXsi.string,
  })),
});

export const buildSamlAttributesTagValues = (
  userInfo: IdTokenProfileStandardClaims,
  attributeMapping: SamlAttributeMapping
): Record<string, string | null> => {
  return Object.entries(attributeMapping).length > 0
    ? Object.fromEntries(
        Object.entries(attributeMapping)
          .map(([key, value]) => [
            value,
            userInfo[key as keyof IdTokenProfileStandardClaims] ?? null,
          ])
          .map(([key, value]) => [
            generateSamlAttributeTag(key),
            typeof value === 'object' ? JSON.stringify(value) : String(value),
          ])
      )
    : Object.fromEntries(
        fallbackAttributes.map((attribute) => [
          generateSamlAttributeTag(attribute),
          (typeof userInfo[attribute] === 'boolean'
            ? String(userInfo[attribute])
            : userInfo[attribute]) ?? null,
        ])
      );
};

export const createSamlTemplateCallback = (
  sp: saml.ServiceProviderInstance,
  idp: saml.IdentityProviderInstance,
  attributeMapping: SamlAttributeMapping,
  {
    userInfo,
    samlRequestId,
    sessionId,
    sessionExpiresAt,
  }: {
    userInfo: IdTokenProfileStandardClaims;
    samlRequestId: string | null;
    sessionId?: string;
    sessionExpiresAt?: string;
  }
) =>
  (template: string) => {
    const assertionConsumerServiceUrl = sp.entityMeta.getAssertionConsumerService(
      saml.Constants.wording.binding.post
    );

    const { nameIDFormat } = idp.entitySetting;
    assertThat(nameIDFormat, 'application.saml.name_id_format_required');
    const { NameIDFormat, NameID } = buildSamlAssertionNameId(userInfo, nameIDFormat);

    const id = `ID_${generateStandardId()}`;
    const now = new Date();
    const expireAt = new Date(now.getTime() + 10 * 60 * 1000);

    const tagValues = {
      ID: id,
      AssertionID: `ID_${generateStandardId()}`,
      Destination: assertionConsumerServiceUrl,
      Audience: sp.entityMeta.getEntityID(),
      EntityID: sp.entityMeta.getEntityID(),
      SubjectRecipient: assertionConsumerServiceUrl,
      Issuer: idp.entityMeta.getEntityID(),
      IssueInstant: now.toISOString(),
      AssertionConsumerServiceURL: assertionConsumerServiceUrl,
      StatusCode: saml.Constants.StatusCode.Success,
      ConditionsNotBefore: now.toISOString(),
      ConditionsNotOnOrAfter: expireAt.toISOString(),
      SubjectConfirmationDataNotOnOrAfter: expireAt.toISOString(),
      NameIDFormat,
      NameID,
      InResponseTo: samlRequestId ?? 'null',
      ...buildSamlAttributesTagValues(userInfo, attributeMapping),
      AuthnContextClassRef:
        saml.Constants.namespace.authnContextClassRef.passwordProtectedTransport,
      SessionNotOnOrAfter: sessionExpiresAt ?? '',
      SessionIndex: sessionId ?? '',
    };

    const context = saml.SamlLib.replaceTagsByValue(template, tagValues);

    return {
      id,
      context,
    };
  };

export const getScopesFromAttributeMapping = (
  nameIdFormat: NameIdFormat,
  attributeMapping: SamlAttributeMapping
): Array<UserScope | ReservedScope> => {
  const requiredScopes = new Set<UserScope | ReservedScope>();
  requiredScopes.add(ReservedScope.OpenId);
  requiredScopes.add(UserScope.Profile);

  if (nameIdFormat === NameIdFormat.EmailAddress) {
    requiredScopes.add(UserScope.Email);
  }

  if (Object.keys(attributeMapping).length === 0) {
    return Array.from(requiredScopes);
  }

  for (const claim of Object.keys(attributeMapping) as Array<keyof SamlAttributeMapping>) {
    if (claim === 'sub') {
      continue;
    }

    for (const [scope, claims] of Object.entries(userClaims) as Array<[UserScope, UserClaim[]]>) {
      if (claims.includes(claim)) {
        requiredScopes.add(scope);
        break;
      }
    }
  }

  return Array.from(requiredScopes);
};
