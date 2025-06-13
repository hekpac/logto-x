import { ReservedResource } from '@logto/core-kit';
import type Libraries from '#src/tenants/Libraries.js';
import { MockQueries } from '#src/test-utils/tenant.js';

import { findResourceScopes } from './resource.js';

const { jest } = import.meta;

const createLibraries = (overrides: Partial<Libraries> = {}): Libraries => ({
  users: { findUserScopesForResourceIndicator: jest.fn() },
  applications: { findApplicationScopesForResourceIndicator: jest.fn() },
  ...overrides,
} as unknown as Libraries);

const mockScope = { id: 'scope', name: 'read:users' };

it('returns scopes for reserved resources', async () => {
  const findAll = jest.fn(async () => [null, [mockScope]]);
  const queries = new MockQueries({ organizations: { scopes: { findAll } } });
  const libraries = createLibraries();

  await expect(
    findResourceScopes({
      queries,
      libraries,
      indicator: ReservedResource.Organization,
      findFromOrganizations: false,
    })
  ).resolves.toEqual([mockScope]);
  expect(findAll).toHaveBeenCalled();
});

it('returns user scopes when user id is provided', async () => {
  const findUserScopesForResourceIndicator = jest.fn(async () => [mockScope]);
  const libraries = createLibraries({
    users: { findUserScopesForResourceIndicator },
  });
  const queries = new MockQueries();

  await expect(
    findResourceScopes({
      queries,
      libraries,
      indicator: 'api',
      userId: 'user',
      organizationId: 'org',
      findFromOrganizations: true,
    })
  ).resolves.toEqual([mockScope]);
  expect(findUserScopesForResourceIndicator).toHaveBeenCalledWith(
    'user',
    'api',
    true,
    'org'
  );
});

it('returns application organization scopes', async () => {
  const getApplicationResourceScopes = jest.fn(async () => [mockScope]);
  const queries = new MockQueries({
    organizations: { relations: { appsRoles: { getApplicationResourceScopes } } },
  });
  const libraries = createLibraries();

  await expect(
    findResourceScopes({
      queries,
      libraries,
      indicator: 'api',
      applicationId: 'app',
      organizationId: 'org',
      findFromOrganizations: true,
    })
  ).resolves.toEqual([mockScope]);
  expect(getApplicationResourceScopes).toHaveBeenCalledWith('org', 'app', 'api');
});

it('returns application scopes when only application id is provided', async () => {
  const findApplicationScopesForResourceIndicator = jest.fn(async () => [mockScope]);
  const libraries = createLibraries({
    applications: { findApplicationScopesForResourceIndicator },
  });
  const queries = new MockQueries();

  await expect(
    findResourceScopes({
      queries,
      libraries,
      indicator: 'api',
      applicationId: 'app',
      findFromOrganizations: false,
    })
  ).resolves.toEqual([mockScope]);
  expect(findApplicationScopesForResourceIndicator).toHaveBeenCalledWith('app', 'api');
});

it('returns empty array when no subject provided', async () => {
  const queries = new MockQueries();
  const libraries = createLibraries();

  await expect(
    findResourceScopes({
      queries,
      libraries,
      indicator: 'api',
      findFromOrganizations: false,
    })
  ).resolves.toEqual([]);
});
