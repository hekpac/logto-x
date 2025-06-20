import { UserScope } from '@logto/core-kit';
import {
  VerificationType,
  MfaFactor,
  AccountCenterControlValue,
  userMfaVerificationResponseGuard,
} from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import { z } from 'zod';

import koaGuard from '#src/middleware/koa-guard.js';

import RequestError from '../../errors/RequestError/index.js';
import { buildVerificationRecordByIdAndType } from '../../libraries/verification.js';
import assertThat from '../../utils/assert-that.js';
import { transpileUserMfaVerifications } from '../../utils/user.js';
import type { UserRouter, RouterInitArgs } from '../types.js';

import { accountApiPrefix } from './constants.js';

export default function mfaVerificationsRoutes<T extends UserRouter>(
  ...[router, { queries, libraries }]: RouterInitArgs<T>
) {
  const {
    users: {
      updateUserById,
      findUserById,
      addUserMfaVerification,
      patchUserMfaVerificationById,
      removeUserMfaVerificationById,
    },
    signInExperiences: { findDefaultSignInExperience },
  } = queries;

  router.get(
    `${accountApiPrefix}/mfa-verifications`,
    koaGuard({
      response: userMfaVerificationResponseGuard,
      status: [200, 400, 401],
    }),
    async (ctx, next) => {
      const { id: userId, scopes } = ctx.auth;
      const { fields } = ctx.accountCenter;

      assertThat(
        fields.mfa === AccountCenterControlValue.Edit ||
          fields.mfa === AccountCenterControlValue.ReadOnly,
        'account_center.field_not_enabled'
      );

      assertThat(
        scopes.has(UserScope.Identities),
        new RequestError({ code: 'auth.unauthorized', status: 401 })
      );

      const user = await findUserById(userId);
      ctx.body = transpileUserMfaVerifications(user.mfaVerifications);

      return next();
    }
  );

  router.post(
    `${accountApiPrefix}/mfa-verifications`,
    koaGuard({
      body: z.object({
        type: z.literal(MfaFactor.WebAuthn),
        newIdentifierVerificationRecordId: z.string(),
        name: z.string().optional(),
      }),
      status: [204, 400, 401],
    }),
    async (ctx, next) => {
      const { id: userId, scopes } = ctx.auth;
      const { newIdentifierVerificationRecordId, name } = ctx.guard.body;
      const { fields } = ctx.accountCenter;
      assertThat(
        fields.mfa === AccountCenterControlValue.Edit,
        'account_center.field_not_editable'
      );

      assertThat(
        scopes.has(UserScope.Identities),
        new RequestError({ code: 'auth.unauthorized', status: 401 })
      );

      // Check new identifier
      const newVerificationRecord = await buildVerificationRecordByIdAndType({
        type: VerificationType.WebAuthn,
        id: newIdentifierVerificationRecordId,
        queries,
        libraries,
      });
      assertThat(newVerificationRecord.isVerified, 'verification_record.not_found');

      const bindMfa = newVerificationRecord.toBindMfa();

      // Check sign in experience, if webauthn is enabled
      const { mfa } = await findDefaultSignInExperience();
      assertThat(
        mfa.factors.includes(MfaFactor.WebAuthn),
        new RequestError({ code: 'session.mfa.mfa_factor_not_enabled', status: 400 })
      );

      const updatedUser = await addUserMfaVerification(userId, {
        ...bindMfa,
        id: generateStandardId(),
        createdAt: new Date().toISOString(),
        name,
      });

      ctx.appendDataHookContext('User.Data.Updated', { user: updatedUser });

      ctx.status = 204;

      return next();
    }
  );

  // Update mfa verification name, only support webauthn
  router.patch(
    `${accountApiPrefix}/mfa-verifications/:verificationId/name`,
    koaGuard({
      params: z.object({
        verificationId: z.string(),
      }),
      body: z.object({
        name: z.string(),
      }),
      status: [200, 400, 401],
    }),
    async (ctx, next) => {
      const { id: userId, scopes } = ctx.auth;
      const { name } = ctx.guard.body;
      const { fields } = ctx.accountCenter;
      assertThat(
        fields.mfa === AccountCenterControlValue.Edit,
        'account_center.field_not_editable'
      );

      assertThat(
        scopes.has(UserScope.Identities),
        new RequestError({ code: 'auth.unauthorized', status: 401 })
      );

      const user = await findUserById(userId);
      const mfaVerification = user.mfaVerifications.find(
        (mfaVerification) =>
          mfaVerification.id === ctx.guard.params.verificationId &&
          mfaVerification.type === MfaFactor.WebAuthn
      );
      assertThat(mfaVerification, 'verification_record.not_found');

      const updatedUser = await patchUserMfaVerificationById(
        userId,
        ctx.guard.params.verificationId,
        { name }
      );

      ctx.appendDataHookContext('User.Data.Updated', { user: updatedUser });

      ctx.status = 200;

      return next();
    }
  );

  router.delete(
    `${accountApiPrefix}/mfa-verifications/:verificationId`,
    koaGuard({
      params: z.object({
        verificationId: z.string(),
      }),
      status: [204, 400, 401],
    }),
    async (ctx, next) => {
      const { id: userId, scopes } = ctx.auth;
      const { fields } = ctx.accountCenter;
      assertThat(
        fields.mfa === AccountCenterControlValue.Edit,
        'account_center.field_not_editable'
      );
      assertThat(
        scopes.has(UserScope.Identities),
        new RequestError({ code: 'auth.unauthorized', status: 401 })
      );

      const mfaVerification = (await findUserById(userId)).mfaVerifications.find(
        (mfaVerification) => mfaVerification.id === ctx.guard.params.verificationId
      );
      assertThat(mfaVerification, 'verification_record.not_found');

      const updatedUser = await removeUserMfaVerificationById(
        userId,
        ctx.guard.params.verificationId
      );

      ctx.appendDataHookContext('User.Data.Updated', { user: updatedUser });

      ctx.status = 204;

      return next();
    }
  );
}
