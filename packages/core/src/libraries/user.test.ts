import { MfaFactor, UsersPasswordEncryptionMethod } from '@logto/schemas';
import { createMockUtils } from '@logto/shared/esm';

import { mockResource, mockAdminUserRole, mockScope } from '#src/__mocks__/index.js';
import { mockUser } from '#src/__mocks__/user.js';
import RequestError from '#src/errors/RequestError/index.js';

const { jest } = import.meta;
const { mockEsm } = createMockUtils(jest);

mockEsm('hash-wasm', () => ({
  argon2Verify: jest.fn(async ({ password }: { password: string }) => {
    return password === 'password';
  }),
  bcryptVerify: jest.fn(async ({ password }: { password: string }) => {
    return password === 'password';
  }),
  md5: jest.fn(async (password) => {
    return password === 'password' ? '5f4dcc3b5aa765d61d8327deb882cf99' : 'wrong';
  }),
  sha1: jest.fn(async (password) => {
    return password === 'password' ? '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8' : 'wrong';
  }),
  sha256: jest.fn(async (password) => {
    return password === 'password'
      ? '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
      : 'wrong';
  }),
}));

mockEsm('#src/utils/password.js', () => ({
  encryptPassword: jest.fn().mockResolvedValue('argon2:xxx'),
  legacyVerify: jest.fn().mockResolvedValue(true),
}));

const { MockQueries } = await import('#src/test-utils/tenant.js');
const { createUserLibrary } = await import('./user.js');
const { encryptUserPassword } = await import('./user.utils.js');

const hasUserWithId = jest.fn();
const updateUserById = jest.fn();
const addUserMfaVerificationQuery = jest.fn();
const getJitOrganizations = jest.fn();
const insertOrganizationUser = jest.fn();
const insertOrganizationUserRole = jest.fn();
const queries = new MockQueries({
  users: {
    hasUserWithId,
    findUserById: async () => mockUser,
    updateUserById,
    addUserMfaVerification: addUserMfaVerificationQuery,
  },
  roles: { findRolesByRoleIds: async () => [mockAdminUserRole] },
  scopes: { findScopesByIdsAndResourceIndicator: async () => [mockScope] },
  usersRoles: { findUsersRolesByUserId: async () => [] },
  rolesScopes: { findRolesScopesByRoleIds: async () => [] },
  organizations: {
    jit: {
      emailDomains: { getJitOrganizations },
      ssoConnectors: { getJitOrganizations: jest.fn() },
      getJitOrganizationsByIds: jest.fn(),
    },
    relations: {
      users: { insert: insertOrganizationUser },
      usersRoles: { insert: insertOrganizationUserRole },
    },
  },
});

describe('generateUserId()', () => {
  const { generateUserId } = createUserLibrary(queries);

  afterEach(() => {
    hasUserWithId.mockClear();
  });

  it('generates user ID with correct length when no conflict found', async () => {
    const mockedHasUserWithId = hasUserWithId.mockImplementationOnce(async () => false);

    await expect(generateUserId()).resolves.toHaveLength(12);
    expect(mockedHasUserWithId).toBeCalledTimes(1);
  });

  it('generates user ID with correct length when retry limit is not reached', async () => {
    // eslint-disable-next-line @silverhand/fp/no-let
    let tried = 0;
    const mockedHasUserWithId = hasUserWithId.mockImplementation(async () => {
      if (tried) {
        return false;
      }

      // eslint-disable-next-line @silverhand/fp/no-mutation
      tried++;

      return true;
    });

    await expect(generateUserId(2)).resolves.toHaveLength(12);
    expect(mockedHasUserWithId).toBeCalledTimes(2);
  });

  it('rejects with correct error message when retry limit is reached', async () => {
    const mockedHasUserWithId = hasUserWithId.mockImplementation(async () => true);

    await expect(generateUserId(10)).rejects.toThrow(
      'Cannot generate user ID in reasonable retries'
    );
    expect(mockedHasUserWithId).toBeCalledTimes(11);
  });
});

describe('encryptUserPassword()', () => {
  it('generates salt, encrypted and method', async () => {
    const { passwordEncryptionMethod, passwordEncrypted } = await encryptUserPassword('password');
    expect(passwordEncryptionMethod).toEqual(UsersPasswordEncryptionMethod.Argon2i);
    expect(passwordEncrypted).toContain('argon2');
  });
});

describe('verifyUserPassword()', () => {
  const { verifyUserPassword } = createUserLibrary(queries);

  describe('Argon2i', () => {
    it('resolves when password is correct', async () => {
      await expect(verifyUserPassword(mockUser, 'password')).resolves.not.toThrowError();
    });

    it('rejects when password is incorrect', async () => {
      await expect(verifyUserPassword(mockUser, 'wrong')).rejects.toThrowError(
        new RequestError({ code: 'session.invalid_credentials', status: 422 })
      );
    });
  });

  describe('Argon2d', () => {
    const user = {
      ...mockUser,
      passwordEncrypted: '$argon2d$v=19$m=16,t=2,p=1$VW1JcEJrMjN1Vnp3Tm5JUA$Ddl/I6Zem7vbZ4r5jPCb/g',
      passwordEncryptionMethod: UsersPasswordEncryptionMethod.Argon2d,
    };

    it('resolves when password is correct', async () => {
      await expect(verifyUserPassword(user, 'password')).resolves.not.toThrowError();
    });

    it('rejects when password is incorrect', async () => {
      await expect(verifyUserPassword(user, 'wrong')).rejects.toThrowError(
        new RequestError({ code: 'session.invalid_credentials', status: 422 })
      );
    });
  });

  describe('Argon2id', () => {
    const user = {
      ...mockUser,
      passwordEncrypted:
        '$argon2id$v=19$m=16,t=2,p=1$VW1JcEJrMjN1Vnp3Tm5JUA$0uzNwxbjs/f/1e5r4uX7JQ',
      passwordEncryptionMethod: UsersPasswordEncryptionMethod.Argon2id,
    };

    it('resolves when password is correct', async () => {
      await expect(verifyUserPassword(user, 'password')).resolves.not.toThrowError();
    });

    it('rejects when password is incorrect', async () => {
      await expect(verifyUserPassword(user, 'wrong')).rejects.toThrowError(
        new RequestError({ code: 'session.invalid_credentials', status: 422 })
      );
    });
  });

  describe('MD5', () => {
    const user = {
      ...mockUser,
      passwordEncrypted: '5f4dcc3b5aa765d61d8327deb882cf99',
      passwordEncryptionMethod: UsersPasswordEncryptionMethod.MD5,
    };
    it('resolves when password is correct', async () => {
      await expect(verifyUserPassword(user, 'password')).resolves.not.toThrowError();
    });

    it('rejects when password is incorrect', async () => {
      await expect(verifyUserPassword(user, 'wrong')).rejects.toThrowError(
        new RequestError({ code: 'session.invalid_credentials', status: 422 })
      );
    });
  });

  describe('SHA1', () => {
    const user = {
      ...mockUser,
      passwordEncrypted: '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8',
      passwordEncryptionMethod: UsersPasswordEncryptionMethod.SHA1,
    };
    it('resolves when password is correct', async () => {
      await expect(verifyUserPassword(user, 'password')).resolves.not.toThrowError();
    });

    it('rejects when password is incorrect', async () => {
      await expect(verifyUserPassword(user, 'wrong')).rejects.toThrowError(
        new RequestError({ code: 'session.invalid_credentials', status: 422 })
      );
    });
  });

  describe('SHA256', () => {
    const user = {
      ...mockUser,
      passwordEncrypted: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      passwordEncryptionMethod: UsersPasswordEncryptionMethod.SHA256,
    };
    it('resolves when password is correct', async () => {
      await expect(verifyUserPassword(user, 'password')).resolves.not.toThrowError();
    });

    it('rejects when password is incorrect', async () => {
      await expect(verifyUserPassword(user, 'wrong')).rejects.toThrowError(
        new RequestError({ code: 'session.invalid_credentials', status: 422 })
      );
    });
  });

  describe('Bcrypt', () => {
    const user = {
      ...mockUser,
      passwordEncrypted: '$2a$12$WQMqTfbtcZFBC1C1u8wpie6lXOSciUr5kk/8yEydoIMKltb9UKJ.6',
      passwordEncryptionMethod: UsersPasswordEncryptionMethod.Bcrypt,
    };
    it('resolves when password is correct', async () => {
      await expect(verifyUserPassword(user, 'password')).resolves.not.toThrowError();
    });

    it('rejects when password is incorrect', async () => {
      await expect(verifyUserPassword(user, 'wrong')).rejects.toThrowError(
        new RequestError({ code: 'session.invalid_credentials', status: 422 })
      );
    });
  });

  describe('Migrate other algorithms to Argon2', () => {
    const user = {
      ...mockUser,
      passwordEncrypted: '5f4dcc3b5aa765d61d8327deb882cf99',
      passwordEncryptionMethod: UsersPasswordEncryptionMethod.MD5,
    };
    it('migrates password to Argon2', async () => {
      await verifyUserPassword(user, 'password');
      expect(updateUserById).toHaveBeenCalledWith(user.id, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        passwordEncrypted: expect.stringContaining('argon2'),
        passwordEncryptionMethod: UsersPasswordEncryptionMethod.Argon2i,
      });
    });
  });
});

describe('findUserScopesForResourceId()', () => {
  const { findUserScopesForResourceIndicator } = createUserLibrary(queries);

  it('returns scopes that the user has access', async () => {
    await expect(
      findUserScopesForResourceIndicator(mockUser.id, mockResource.indicator)
    ).resolves.toEqual([mockScope]);
  });
});

describe('findUserRoles()', () => {
  const { findUserRoles } = createUserLibrary(queries);

  it('returns user roles', async () => {
    await expect(findUserRoles(mockUser.id)).resolves.toEqual([mockAdminUserRole]);
  });
});

describe('addUserMfaVerification()', () => {
  const createdAt = new Date().toISOString();
  const { addUserMfaVerification } = createUserLibrary(queries);

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(createdAt));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('appends a new mfa verification', async () => {
    await addUserMfaVerification(mockUser.id, { type: MfaFactor.TOTP, secret: 'secret' });
    expect(addUserMfaVerificationQuery).toHaveBeenCalledWith(mockUser.id, {
      type: MfaFactor.TOTP,
      key: 'secret',
      id: expect.any(String),
      createdAt,
    });
    expect(updateUserById).not.toHaveBeenCalled();
  });
});

describe('provisionOrganizations()', () => {
  const { provisionOrganizations } = createUserLibrary(queries);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips provisioning when email is not verified', async () => {
    await expect(
      provisionOrganizations({ userId: mockUser.id, email: 'a@b.com', emailVerified: false })
    ).resolves.toEqual([]);
    expect(getJitOrganizations).not.toHaveBeenCalled();
    expect(insertOrganizationUser).not.toHaveBeenCalled();
    expect(insertOrganizationUserRole).not.toHaveBeenCalled();
  });
});
