import { ReservedResource } from '@logto/core-kit';
import { type Resource } from '@logto/schemas';
import { trySafe, type Nullable } from '@silverhand/essentials';
import { type ResourceServer } from 'oidc-provider';

import { type EnvSet } from '#src/env-set/index.js';
import type Libraries from '#src/tenants/Libraries.js';
import type Queries from '#src/tenants/Queries.js';

const isReservedResource = (indicator: string): indicator is ReservedResource =>
  // eslint-disable-next-line no-restricted-syntax -- it's the best way to do it
  (Object.values(ReservedResource) as ReservedResource[]).includes(
    indicator as ReservedResource
  );

export const getSharedResourceServerData = (
  envSet: EnvSet
): Pick<ResourceServer, 'accessTokenFormat' | 'jwt'> => ({
  accessTokenFormat: 'jwt',
  jwt: {
    sign: { alg: envSet.oidc.jwkSigningAlg },
  },
});

/**
 * Find the scopes for a given resource indicator according to the subject in the context. The
 * subject can be either a user or an application.
 *
 * When both `userId` and `applicationId` are provided, the function will prioritize the user.
 *
 * This function also handles the reserved resources.
 *
 * @see {@link ReservedResource} for the list of reserved resources.
 */
const reservedScopeResolvers: Record<
  ReservedResource,
  (queries: Queries) => Promise<ReadonlyArray<{ name: string; id: string }>>
> = {
  [ReservedResource.Organization]: async (queries) => {
    const [, rows] = await queries.organizations.scopes.findAll();
    return rows as ReadonlyArray<{ name: string; id: string }>;
  },
};

const findReservedResourceScopes = (
  queries: Queries,
  indicator: ReservedResource
) =>
  reservedScopeResolvers[indicator]?.(queries) ??
  Promise.resolve([] as ReadonlyArray<{ name: string; id: string }>);

const findSubjectResourceScopes = async (
  queries: Queries,
  libraries: Libraries,
  indicator: string,
  {
    userId,
    applicationId,
    organizationId,
    findFromOrganizations,
  }: {
    userId?: string;
    applicationId?: string;
    organizationId?: string;
    findFromOrganizations: boolean;
  }
): Promise<ReadonlyArray<{ name: string; id: string }>> => {
  const {
    users: { findUserScopesForResourceIndicator },
    applications: { findApplicationScopesForResourceIndicator },
  } = libraries;

  if (userId) {
    return (await findUserScopesForResourceIndicator(
      userId,
      indicator,
      findFromOrganizations,
      organizationId
    )) as ReadonlyArray<{ name: string; id: string }>;
  }

  if (applicationId) {
    if (organizationId) {
      return (await queries.organizations.relations.appsRoles.getApplicationResourceScopes(
        organizationId,
        applicationId,
        indicator
      )) as ReadonlyArray<{ name: string; id: string }>;
    }

    return (await findApplicationScopesForResourceIndicator(
      applicationId,
      indicator
    )) as ReadonlyArray<{ name: string; id: string }>;
  }

  return [];
};

export const findResourceScopes = async ({
  queries,
  libraries,
  userId,
  applicationId,
  indicator,
  organizationId,
  findFromOrganizations,
}: {
  queries: Queries;
  libraries: Libraries;
  indicator: string;
  /**
   * In consent or code exchange flow, the `organizationId` is `undefined`, and all the scopes
   * inherited from the all organization roles should be granted.
   *
   * In the flow of granting token for a specific organization with API resource, `organizationId`
   * is provided, and only the scopes inherited from that organization should be granted.
   *
   * Note: This value does not affect the reserved resources and application subjects.
   */
  findFromOrganizations: boolean;
  userId?: string;
  applicationId?: string;
  organizationId?: string;
}): Promise<ReadonlyArray<{ name: string; id: string }>> => {
  if (isReservedResource(indicator)) {
    return findReservedResourceScopes(queries, indicator);
  }

  return findSubjectResourceScopes(queries, libraries, indicator, {
    userId,
    applicationId,
    organizationId,
    findFromOrganizations,
  });
};

/**
 * The default TTL (Time To Live) of the access token for the reversed resources.
 * It may be configurable in the future.
 */
export const reversedResourceAccessTokenTtl = 3600;

/**
 * Find the resource for a given indicator. This function also handles the reserved
 * resources.
 *
 * @see {@link ReservedResource} for the list of reserved resources.
 */
export const findResource = async (
  queries: Queries,
  indicator: string
): Promise<Nullable<Pick<Resource, 'indicator' | 'accessTokenTtl'>>> => {
  if (isReservedResource(indicator)) {
    return {
      indicator,
      accessTokenTtl: reversedResourceAccessTokenTtl,
    };
  }

  return (await queries.resources.findResourceByIndicator(
    indicator
  )) as Nullable<Pick<Resource, 'indicator' | 'accessTokenTtl'>>;
};

export const isThirdPartyApplication = async ({ applications }: Queries, applicationId: string) => {
  // Demo-app not exist in the database
  const application = await trySafe(async () => applications.findApplicationById(applicationId));

  return application?.isThirdParty ?? false;
};

/**
 * Filter out the unsupported scopes for the third-party application.
 *
 * third-party application can only request the scopes that are enabled in the client scope metadata  @see {@link https://github.com/panva/node-oidc-provider/blob/main/docs/README.md#clients}
 * However, the client scope metadata does not support prefix matching and resource scopes name are not unique, so we need to filter out the resource and organization scopes specifically based on the resource indicator.
 *
 * Available resource scopes can be found using {@link findResourceScopes}.
 */
const filterOrganizationScopesByConsent = (
  scopes: ReadonlyArray<{ name: string; id: string }>,
  consentScopes: ReadonlyArray<{ id: string }>
) =>
  scopes.filter(({ id: organizationScopeId }) =>
    consentScopes.some(({ id }) => id === organizationScopeId)
  );

const getConsentScopesForResource = async (
  libraries: Libraries,
  applicationId: string,
  indicator: string,
  includeOrganizationResourceScopes: boolean,
  includeResourceScopes: boolean
) => {
  const {
    applications: {
      getApplicationUserConsentResourceScopes,
      getApplicationUserConsentOrganizationResourceScopes,
    },
  } = libraries;

  const userConsentResources = includeResourceScopes
    ? await getApplicationUserConsentResourceScopes(applicationId)
    : [];
  const userConsentResource = userConsentResources.find(
    ({ resource }) => resource.indicator === indicator
  );

  const userConsentOrganizationResources = includeOrganizationResourceScopes
    ? await getApplicationUserConsentOrganizationResourceScopes(applicationId)
    : [];
  const userConsentOrganizationResource = userConsentOrganizationResources.find(
    ({ resource }) => resource.indicator === indicator
  );

  return [
    ...(userConsentResource?.scopes ?? []),
    ...(userConsentOrganizationResource?.scopes ?? []),
  ];
};

export const filterResourceScopesForTheThirdPartyApplication = async (
  libraries: Libraries,
  applicationId: string,
  indicator: string,
  scopes: ReadonlyArray<{ name: string; id: string }>,
  {
    includeOrganizationResourceScopes = true,
    includeResourceScopes = true,
  }: { includeOrganizationResourceScopes?: boolean; includeResourceScopes?: boolean } = {}
) => {
  const {
    applications: { getApplicationUserConsentOrganizationScopes },
  } = libraries;

  if (isReservedResource(indicator)) {
    const userConsentOrganizationScopes =
      await getApplicationUserConsentOrganizationScopes(applicationId);

    return filterOrganizationScopesByConsent(scopes, userConsentOrganizationScopes);
  }

  const resourceScopes = await getConsentScopesForResource(
    libraries,
    applicationId,
    indicator,
    includeOrganizationResourceScopes,
    includeResourceScopes
  );

  return filterOrganizationScopesByConsent(scopes, resourceScopes);
};

/**
 * Check if the user has consented to the application for the specific organization.
 *
 * User will be asked to grant the organization access to the application on the consent page.
 * User application organization grant status can be managed using management API.
 */
export const isOrganizationConsentedToApplication = async (
  { applications: { userConsentOrganizations } }: Queries,
  applicationId: string,
  accountId: string,
  organizationId: string
) => {
  return userConsentOrganizations.exists({ applicationId, userId: accountId, organizationId });
};
