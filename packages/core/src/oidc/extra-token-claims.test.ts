import { userProfileJsonGuard } from './extra-token-claims.js';

describe('userProfileJsonGuard', () => {
  it('should strip undefined fields', () => {
    const profile = {
      familyName: 'Smith',
      givenName: undefined,
      address: { country: 'US', region: undefined },
    } as unknown;

    const result = userProfileJsonGuard.parse(profile);

    expect(result).toEqual({
      familyName: 'Smith',
      address: { country: 'US' },
    });
  });
});
