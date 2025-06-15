import { type IRouterParamContext } from 'koa-router';

type Auth = {
  type: 'user' | 'app';
  id: string;
  scopes: Set<string>;
  /** Client ID of the OIDC access token */
  clientId?: string;
};

export type WithAuthContext<ContextT extends IRouterParamContext = IRouterParamContext> =
  ContextT & {
    auth: Auth;
  };

export type TokenInfo = {
  sub: string;
  clientId: unknown;
  scopes: string[];
};
