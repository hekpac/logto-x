import type { MiddlewareType } from 'koa';
import { type IRouterParamContext } from 'koa-router';

import type { WithLogContext } from '#src/middleware/koa-audit-log.js';
import type { WithInteractionDetailsContext } from '#src/middleware/koa-interaction-details.js';
import type TenantContext from '#src/tenants/TenantContext.js';

import type { WithInteractionSieContext } from './koa-interaction-sie.js';
import type { WithInteractionHooksContext } from './koa-interaction-hooks.js';
import {
  getInteractionStorage,
  isForgotPasswordInteractionResult,
  isSignInInteractionResult,
} from '../utils/interaction.js';
import {
  validateBindMfaBackupCode,
  validateMandatoryBindMfa,
  validateMandatoryUserProfile,
  verifyBindMfa,
  verifyIdentifier,
  verifyMfa,
  verifyProfile,
} from '../verifications/index.js';
import type {
  RegisterInteractionResult,
  VerifiedInteractionResult,
  VerifiedRegisterInteractionResult,
  VerifiedSignInInteractionResult,
} from '../types/index.js';

export type WithVerifiedInteractionContext<
  ContextT extends IRouterParamContext = IRouterParamContext,
> = ContextT & { verifiedInteraction: VerifiedInteractionResult };

export default function koaInteractionVerifications<
  StateT,
  ContextT extends WithInteractionDetailsContext &
    WithInteractionSieContext &
    WithLogContext &
    WithInteractionHooksContext,
  ResponseT,
>(tenant: TenantContext): MiddlewareType<StateT, WithVerifiedInteractionContext<ContextT>, ResponseT> {
  const { provider, queries } = tenant;

  return async (ctx, next) => {
    const interactionStorage = getInteractionStorage(ctx.interactionDetails.result);

    let interaction: RegisterInteractionResult | VerifiedInteractionResult =
      await verifyIdentifier(ctx, tenant, interactionStorage);

    if (isSignInInteractionResult(interaction)) {
      interaction = await verifyMfa(ctx, tenant, interaction);
    }

    interaction = (await verifyProfile(tenant, interaction)) as VerifiedInteractionResult;

    if (!isForgotPasswordInteractionResult(interaction)) {
      interaction = (await validateMandatoryUserProfile(
        queries.users,
        ctx,
        interaction as VerifiedSignInInteractionResult | VerifiedRegisterInteractionResult,
      )) as VerifiedInteractionResult;

      interaction = (await verifyBindMfa(
        tenant,
        interaction as VerifiedSignInInteractionResult | VerifiedRegisterInteractionResult,
      )) as VerifiedInteractionResult;

      interaction = (await validateMandatoryBindMfa(
        tenant,
        ctx,
        interaction as VerifiedSignInInteractionResult | VerifiedRegisterInteractionResult,
      )) as VerifiedInteractionResult;

      interaction = (await validateBindMfaBackupCode(
        tenant,
        ctx,
        interaction as VerifiedSignInInteractionResult | VerifiedRegisterInteractionResult,
        provider,
      )) as VerifiedInteractionResult;
    }

    // eslint-disable-next-line @silverhand/fp/no-mutation
    ctx.verifiedInteraction = interaction;

    return next();
  };
}
