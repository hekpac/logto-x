import {
  InteractionEvent,
  SignInIdentifier,
  type VerificationCodeIdentifier,
} from '@logto/schemas';

import { deleteUser } from '#src/api/admin-user.js';
import { initExperienceClient, logoutClient, processSession } from '#src/helpers/client-helper.js';
import { setEmailConnector, setSmsConnector } from '#src/helpers/connector-helper.js';
import { signInWithVerificationCode } from '#src/helpers/experience/index.js';
import {
  successfullySendVerificationCode,
  successfullyVerifyVerificationCode,
} from '#src/helpers/experience/verification-code-helper.js';
import { expectRejects } from '#src/helpers/index.js';
import { enableAllVerificationCodeSignInMethods } from '#src/helpers/sign-in-experience-helper.js';
import { generateNewUser } from '#src/helpers/user-helper.js';
import { generateEmail, generatePhone } from '#src/test-env-utils.js';

const verificationIdentifierType: readonly [SignInIdentifier.Email, SignInIdentifier.Phone] =
  Object.freeze([SignInIdentifier.Email, SignInIdentifier.Phone]);

const identifiersTypeToUserProfile = Object.freeze({
  email: 'primaryEmail',
  phone: 'primaryPhone',
});

describe('Sign-in with verification code', () => {
  beforeAll(async () => {
    await Promise.all([setEmailConnector(), setSmsConnector()]);
    await enableAllVerificationCodeSignInMethods({
      identifiers: [SignInIdentifier.Email, SignInIdentifier.Phone],
      password: false,
      verify: true,
    });
  });

  it.each(verificationIdentifierType)(
    'should sign-in with verification code using %p',
    async (identifier) => {
      const { userProfile, user } = await generateNewUser({
        [identifiersTypeToUserProfile[identifier]]: true,
        password: true,
      });

      await signInWithVerificationCode({
        type: identifier,
        value: userProfile[identifiersTypeToUserProfile[identifier]]!,
      });

      await deleteUser(user.id);
    }
  );

  it.each(verificationIdentifierType)(
    'should fail to sign-in with non-existing %p identifier and directly sign-up instead',
    async (type) => {
      const identifier: VerificationCodeIdentifier = {
        type,
        value: type === SignInIdentifier.Email ? generateEmail() : generatePhone(),
      };

      const client = await initExperienceClient();

      const { verificationId, code } = await successfullySendVerificationCode(client, {
        identifier,
        interactionEvent: InteractionEvent.SignIn,
      });

      await successfullyVerifyVerificationCode(client, {
        identifier,
        verificationId,
        code,
      });

      await expectRejects(
        client.identifyUser({
          verificationId,
        }),
        {
          code: 'user.user_not_exist',
          status: 404,
        }
      );

      await client.updateInteractionEvent({ interactionEvent: InteractionEvent.Register });

      await client.identifyUser({
        verificationId,
      });

      const { redirectTo } = await client.submitInteraction();
      const userId = await processSession(client, redirectTo);
      await logoutClient(client);

      await deleteUser(userId);
    }
  );
});
