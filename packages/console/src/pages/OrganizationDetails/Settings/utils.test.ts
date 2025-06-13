import { emptyBranding } from '@/types/sign-in-experience';
import { assembleData, normalizeData } from './utils';
import type { Organization } from '@logto/schemas';

describe('branding removal', () => {
  const jit = { emailDomains: [], roles: [], ssoConnectorIds: [] };

  const organization = {
    id: 'org1',
    tenantId: 'tenant1',
    name: 'test',
    description: 'desc',
    isMfaRequired: false,
    customData: {},
    createdAt: '2024-01-01T00:00:00Z',
    branding: { logoUrl: 'http://logo.png', darkLogoUrl: '', favicon: '', darkFavicon: '' },
  } as unknown as Organization;

  it('should remove branding from form when deleted', () => {
    const form = normalizeData(organization, jit);
    form.branding.logoUrl = '';
    form.branding.darkLogoUrl = '';
    form.branding.favicon = '';
    form.branding.darkFavicon = '';

    const updated = assembleData(form);
    expect(updated.branding).toEqual({});

    const normalized = normalizeData({ ...organization, branding: updated.branding } as Organization, jit);
    expect(normalized.branding).toEqual(emptyBranding);
  });
});

