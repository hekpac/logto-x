import { LogtoJwtTokenKeyType } from '@logto/schemas';

import { getApiPath, getPagePath } from '../pages/CustomizeJwt/utils/path';

describe('jwt customizer path helpers', () => {
  it('generates base paths when no tokenType provided', () => {
    expect(getApiPath()).toBe('api/configs/jwt-customizer');
    expect(getPagePath()).toBe('/customize-jwt');
  });

  it('generates paths with token type and action', () => {
    expect(getApiPath(LogtoJwtTokenKeyType.AccessToken)).toBe(
      'api/configs/jwt-customizer/access-token'
    );
    expect(getPagePath(LogtoJwtTokenKeyType.AccessToken, 'edit')).toBe(
      '/customize-jwt/access-token/edit'
    );
  });

  it('falls back to main page when action missing', () => {
    expect(getPagePath(LogtoJwtTokenKeyType.ClientCredentials)).toBe('/customize-jwt');
  });
});
