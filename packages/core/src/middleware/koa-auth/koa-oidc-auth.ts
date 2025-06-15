import type { MiddlewareType } from 'koa';
import type { IRouterParamContext } from 'koa-router';

import RequestError from '#src/errors/RequestError/index.js';
import type TenantContext from '#src/tenants/TenantContext.js';
import assertThat from '#src/utils/assert-that.js';

import { type WithAuthContext } from './types.js';
import { extractBearerTokenFromHeaders } from './utils.js';


/**
 * Auth middleware for OIDC opaque token
 */
export default function koaOidcAuth<StateT, ContextT extends IRouterParamContext, ResponseBodyT>(
  tenant: TenantContext
): MiddlewareType<StateT, WithAuthContext<ContextT>, ResponseBodyT> {
  const authMiddleware: MiddlewareType<StateT, WithAuthContext<ContextT>, ResponseBodyT> = async (
    ctx,
    next
  ) => {
    const { request } = ctx;
    const accessTokenValue = extractBearerTokenFromHeaders(request.headers);
    const accessToken = await tenant.provider.AccessToken.find(accessTokenValue);

    assertThat(accessToken, new RequestError({ code: 'auth.unauthorized', status: 401 }));

    const { accountId, scopes, clientId } = accessToken;
    assertThat(accountId, new RequestError({ code: 'auth.unauthorized', status: 401 }));
    assertThat(scopes.has('openid'), new RequestError({ code: 'auth.forbidden', status: 403 }));

    ctx.auth = {
      type: 'user',
      id: accountId,
      scopes,
      clientId,
    };

    return next();
  };

  return authMiddleware;
}
