import { cleanDeep } from '@logto/shared/universal';
import { SyncProfileMode } from '@/types/connector';
import { formDataToSsoConnectorParser, type FormType } from '../pages/EnterpriseSsoDetails/Experience';

describe('branding cleanup on submit', () => {
  const baseFormData: FormType = {
    connectorName: 'name',
    branding: { displayName: '', logo: '', darkLogo: '' },
    domains: [{ id: '1', value: 'example.com' }],
    syncProfile: SyncProfileMode.OnlyAtRegister,
  };

  it('should clean up empty branding fields', () => {
    const parsed = cleanDeep(formDataToSsoConnectorParser(baseFormData), { emptyObjects: false });
    expect(parsed.branding).toEqual({});
  });

  it('should keep non-empty branding fields', () => {
    const formData: FormType = {
      ...baseFormData,
      branding: { displayName: 'Foo', logo: '', darkLogo: '' },
    };

    const parsed = cleanDeep(formDataToSsoConnectorParser(formData), { emptyObjects: false });
    expect(parsed.branding).toEqual({ displayName: 'Foo' });
  });
});
