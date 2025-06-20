import { ConnectorType, InteractionEvent, SignInIdentifier, SignInMode } from '@logto/schemas';
import { generateStandardId } from '@logto/shared';

import { mockSocialConnectorId } from '#src/__mocks__/connectors-mock.js';
import { deleteUser } from '#src/api/admin-user.js';
import { createOneTimeToken } from '#src/api/one-time-token.js';
import { updateSignInExperience } from '#src/api/sign-in-experience.js';
import { SsoConnectorApi } from '#src/api/sso-connector.js';
import { setAlwaysFailCaptcha, setAlwaysPassCaptcha } from '#src/helpers/captcha-helper.js';
import { initExperienceClient, processSession } from '#src/helpers/client-helper.js';
import {
  clearConnectorsByTypes,
  setEmailConnector,
  setSocialConnector,
} from '#src/helpers/connector-helper.js';
import {
  registerNewUserUsernamePassword,
  signInWithEnterpriseSso,
  signInWithPassword,
  signInWithSocial,
} from '#src/helpers/experience/index.js';
import { expectRejects } from '#src/helpers/index.js';
import {
  disableCaptcha,
  enableAllPasswordSignInMethods,
  enableCaptcha,
} from '#src/helpers/sign-in-experience-helper.js';
import { UserApiTest, generateNewUser, generateNewUserProfile } from '#src/helpers/user-helper.js';
import { generateEmail } from '#src/test-env-utils.js';

import { successfullySendVerificationCode } from '../../../../helpers/experience/verification-code-helper.js';

describe('captcha', () => {
  beforeAll(async () => {
    await enableAllPasswordSignInMethods();
    await updateSignInExperience({
      signUp: {
        identifiers: [SignInIdentifier.Username],
        password: true,
        verify: false,
      },
      passwordPolicy: {},
    });
    await enableCaptcha();
    await setAlwaysPassCaptcha();
  });

  afterEach(async () => {
    await setAlwaysPassCaptcha();
  });

  afterAll(async () => {
    await disableCaptcha();
  });

  describe('basic sign in and captcha verification failure', () => {
    it('should sign-in successfully with captcha token', async () => {
      const { userProfile, user } = await generateNewUser({
        username: true,
        password: true,
      });

      await signInWithPassword({
        identifier: {
          type: SignInIdentifier.Username,
          value: userProfile.username,
        },
        password: userProfile.password,
        captchaToken: 'captcha-token',
      });

      await deleteUser(user.id);
    });

    it('should fail to sign-in if no captcha token', async () => {
      const { userProfile, user } = await generateNewUser({
        username: true,
        password: true,
      });

      await expectRejects(
        signInWithPassword({
          identifier: {
            type: SignInIdentifier.Username,
            value: userProfile.username,
          },
          password: userProfile.password,
        }),
        {
          code: 'session.captcha_required',
          status: 422,
        }
      );

      await deleteUser(user.id);
    });

    it('should fail to sign-in if captcha token is invalid', async () => {
      await setAlwaysFailCaptcha();
      const { userProfile, user } = await generateNewUser({
        username: true,
        password: true,
      });

      await expectRejects(
        signInWithPassword({
          identifier: { type: SignInIdentifier.Username, value: userProfile.username },
          password: userProfile.password,
          captchaToken: 'captcha-token',
        }),
        {
          code: 'session.captcha_failed',
          status: 422,
        }
      );

      await deleteUser(user.id);
    });
  });

  describe('register', () => {
    it('should register successfully with captcha token', async () => {
      const { username, password } = generateNewUserProfile({ username: true, password: true });
      const userId = await registerNewUserUsernamePassword(username, password, 'captcha-token');

      await signInWithPassword({
        identifier: {
          type: SignInIdentifier.Username,
          value: username,
        },
        password,
        captchaToken: 'captcha-token',
      });

      await deleteUser(userId);
    });

    it('should fail to register if no captcha token is provided', async () => {
      const { username, password } = generateNewUserProfile({ username: true, password: true });
      await expectRejects(registerNewUserUsernamePassword(username, password), {
        code: 'session.captcha_required',
        status: 422,
      });

      // Register again with the same username, ensure the user is not created
      const userId = await registerNewUserUsernamePassword(username, password, 'captcha-token');
      await deleteUser(userId);
    });
  });

  describe('social verification', () => {
    const connectorIdMap = new Map<string, string>();
    const socialUserId = generateStandardId();

    beforeAll(async () => {
      await clearConnectorsByTypes([ConnectorType.Social]);
      const { id: socialConnectorId } = await setSocialConnector();
      connectorIdMap.set(mockSocialConnectorId, socialConnectorId);
      await updateSignInExperience({
        signUp: {
          identifiers: [],
          password: true,
          verify: false,
        },
        passwordPolicy: {},
      });
    });

    afterAll(async () => {
      await clearConnectorsByTypes([ConnectorType.Social]);
    });

    it('should skip captcha for social registration', async () => {
      const userId = await signInWithSocial(
        connectorIdMap.get(mockSocialConnectorId)!,
        {
          id: socialUserId,
        },
        {
          registerNewUser: true,
        }
      );
      await deleteUser(userId);
    });
  });

  describe('enterprise sso verification', () => {
    const ssoConnectorApi = new SsoConnectorApi();
    const domain = 'foo.com';
    const enterpriseSsoIdentityId = generateStandardId();
    const email = generateEmail(domain);
    const userApi = new UserApiTest();

    beforeAll(async () => {
      await ssoConnectorApi.createMockOidcConnector([domain]);
      await updateSignInExperience({
        singleSignOnEnabled: true,
        signUp: { identifiers: [], password: false, verify: false },
      });
    });

    afterAll(async () => {
      await Promise.all([ssoConnectorApi.cleanUp(), userApi.cleanUp()]);
    });

    it('should skip captcha for enterprise sso verification', async () => {
      const userId = await signInWithEnterpriseSso(
        ssoConnectorApi.firstConnectorId!,
        {
          sub: enterpriseSsoIdentityId,
          email,
          email_verified: true,
        },
        true
      );
      await deleteUser(userId);
    });
  });

  describe('one-time token verification', () => {
    beforeAll(async () => {
      await setEmailConnector();
      await updateSignInExperience({
        signInMode: SignInMode.SignInAndRegister,
        signUp: {
          identifiers: [SignInIdentifier.Email],
          password: false,
          verify: true,
        },
        signIn: {
          methods: [
            {
              identifier: SignInIdentifier.Username,
              password: true,
              verificationCode: false,
              isPasswordPrimary: true,
            },
            {
              identifier: SignInIdentifier.Email,
              password: true,
              verificationCode: true,
              isPasswordPrimary: false,
            },
          ],
        },
      });
    });

    afterAll(async () => {
      await clearConnectorsByTypes([ConnectorType.Email]);
    });

    it('should skip captcha for one-time token registration', async () => {
      const client = await initExperienceClient({
        interactionEvent: InteractionEvent.Register,
      });

      const oneTimeToken = await createOneTimeToken({
        email: 'foo@logto.io',
      });

      const { verificationId } = await client.verifyOneTimeToken({
        token: oneTimeToken.token,
        identifier: {
          type: SignInIdentifier.Email,
          value: 'foo@logto.io',
        },
      });

      await client.identifyUser({ verificationId });

      const { redirectTo } = await client.submitInteraction();
      const userId = await processSession(client, redirectTo);
      await deleteUser(userId);
    });
  });

  describe('verification code', () => {
    beforeAll(async () => {
      await setEmailConnector();
    });

    it('should fail to send verification code without captcha token', async () => {
      const { userProfile } = await generateNewUser({
        primaryEmail: true,
        password: true,
      });

      const client = await initExperienceClient({
        interactionEvent: InteractionEvent.Register,
      });

      await expectRejects(
        client.sendVerificationCode({
          identifier: {
            type: SignInIdentifier.Email,
            value: userProfile.primaryEmail,
          },
          interactionEvent: InteractionEvent.Register,
        }),
        {
          code: 'session.captcha_required',
          status: 422,
        }
      );
    });

    it('should be able to send verification code with captcha token', async () => {
      const { userProfile } = await generateNewUser({
        primaryEmail: true,
        password: true,
      });

      const client = await initExperienceClient({
        interactionEvent: InteractionEvent.Register,
        captchaToken: 'captcha-token',
      });

      await successfullySendVerificationCode(client, {
        identifier: { type: SignInIdentifier.Email, value: userProfile.primaryEmail },
        interactionEvent: InteractionEvent.Register,
      });
    });
  });
});
