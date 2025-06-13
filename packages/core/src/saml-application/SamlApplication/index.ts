/* eslint-disable max-lines */
import { parseJson } from '@logto/connector-kit';

import { Prompt, QueryKey } from '@logto/js';
import {
  type SamlAcsUrl,
  BindingType,
  NameIdFormat,
} from '@logto/schemas';
import { cond, tryThat, type Nullable, type Optional } from '@silverhand/essentials';
import camelcaseKeys, { type CamelCaseKeys } from 'camelcase-keys';
import { XMLValidator } from 'fast-xml-parser';
import saml from 'samlify';
import { ZodError, z } from 'zod';

import { type EnvSet } from '#src/env-set/index.js';
import RequestError from '#src/errors/RequestError/index.js';
import {
  buildSingleSignOnUrl,
  buildSamlIdentityProviderEntityId,
} from '#src/libraries/saml-application/utils.js';
import { type SamlApplicationDetails } from '#src/queries/saml-application/index.js';
import {
  fetchOidcConfigRaw,
  getRawUserInfoResponse,
  handleTokenExchange,
} from '#src/sso/OidcConnector/utils.js';
import {
  idTokenProfileStandardClaimsGuard,
  type OidcConfigResponse,
  type IdTokenProfileStandardClaims,
} from '#src/sso/types/oidc.js';
import assertThat from '#src/utils/assert-that.js';

import { getSamlAppCallbackUrl } from './utils.js';
import SamlApplicationConfig from './config.js';
import {
  createSamlTemplateCallback,
  buildLoginResponseTemplate,
  getScopesFromAttributeMapping,
} from './attribute-utils.js';

type SamlIdentityProviderConfig = {
  entityId: string;
  certificate: string;
  singleSignOnUrl: string;
  privateKey: string;
  nameIdFormat: NameIdFormat;
  encryptSamlAssertion: boolean;
};

type SamlServiceProviderConfig = {
  entityId: string;
  acsUrl: SamlAcsUrl;
  certificate?: string;
};


export class SamlApplication {
  public config: SamlApplicationConfig;

  protected endpoint: URL;
  protected issuer: string;
  protected oidcConfig?: CamelCaseKeys<OidcConfigResponse>;

  private _idp?: saml.IdentityProviderInstance;
  private _sp?: saml.ServiceProviderInstance;

  constructor(
    details: SamlApplicationDetails,
    protected samlApplicationId: string,
    protected envSet: EnvSet
  ) {
    this.config = new SamlApplicationConfig(details, envSet.endpoint);
    this.issuer = envSet.oidc.issuer;
    this.endpoint = envSet.endpoint;
  }

  public get idp(): saml.IdentityProviderInstance {
    this._idp ||= this.buildSamlIdentityProvider();
    this.setSchemaValidator();
    return this._idp;
  }

  public get sp(): saml.ServiceProviderInstance {
    this._sp ||= this.buildSamlServiceProvider();
    this.setSchemaValidator();
    return this._sp;
  }

  public get idPMetadata() {
    return this.idp.getMetadata();
  }

  public get idPCertificate() {
    return this.config.certificate;
  }

  public get samlAppCallbackUrl() {
    return getSamlAppCallbackUrl(this.endpoint, this.samlApplicationId).toString();
  }

  public async parseLoginRequest(
    binding: 'post' | 'redirect',
    loginRequest: Parameters<typeof saml.IdentityProviderInstance.prototype.parseLoginRequest>[2]
  ) {
    return this.idp.parseLoginRequest(this.sp, binding, loginRequest);
  }

  public createSamlResponse = async ({
    userInfo,
    relayState,
    samlRequestId,
    sessionId,
    sessionExpiresAt,
  }: {
    userInfo: IdTokenProfileStandardClaims;
    relayState: Nullable<string>;
    samlRequestId: Nullable<string>;
    sessionId: Optional<string>;
    sessionExpiresAt: Optional<string>;
  }): Promise<{ context: string; entityEndpoint: string }> => {
    const bindingMethod = this.config.acsUrl.binding === BindingType.Post ? 'post' : 'redirect';

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { context, entityEndpoint } = await this.idp.createLoginResponse(
      this.sp,
      // @ts-expect-error --fix request object later
      null,
      bindingMethod,
      userInfo,
      createSamlTemplateCallback(this.sp, this.idp, this.config.attributeMapping, {
        userInfo,
        samlRequestId: samlRequestId ?? null,
        sessionId,
        sessionExpiresAt,
      }),
      this.config.encryption?.encryptThenSign,
      relayState ?? undefined
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { context, entityEndpoint };
  };

  // Helper functions for SAML callback
  public handleOidcCallbackAndGetUserInfo = async ({ code }: { code: string }) => {
    // Exchange authorization code for tokens
    const { accessToken } = await this.exchangeAuthorizationCode({
      code,
    });

    assertThat(accessToken, new RequestError('oidc.access_denied'));

    // Get user info using access token
    return this.getUserInfo({ accessToken });
  };

  public getSignInUrl = async ({ state }: { state?: string }) => {
    const { authorizationEndpoint } = await this.fetchOidcConfig();

    const queryParameters = new URLSearchParams({
      [QueryKey.ClientId]: this.samlApplicationId,
      [QueryKey.RedirectUri]: this.config.redirectUri,
      [QueryKey.ResponseType]: 'code',
      [QueryKey.Prompt]: Prompt.Login,
    });

    queryParameters.append(
      QueryKey.Scope,
      // For security reasons, DO NOT include the offline_access scope by default.
      getScopesFromAttributeMapping(this.config.nameIdFormat, this.config.attributeMapping).join(' ')
    );

    if (state) {
      queryParameters.append(QueryKey.State, state);
    }

    return new URL(`${authorizationEndpoint}?${queryParameters.toString()}`);
  };

  protected buildSamlIdentityProvider = (): saml.IdentityProviderInstance => {
    const {
      entityId,
      certificate,
      singleSignOnUrl,
      privateKey,
      nameIdFormat,
      encryptSamlAssertion,
    } = this.buildIdpConfig();
    // eslint-disable-next-line new-cap
    return saml.IdentityProvider({
      entityID: entityId,
      signingCert: certificate,
      singleSignOnService: [
        {
          Location: singleSignOnUrl,
          Binding: BindingType.Redirect,
        },
        {
          Location: singleSignOnUrl,
          Binding: BindingType.Post,
        },
      ],
      privateKey,
      isAssertionEncrypted: encryptSamlAssertion,
      loginResponseTemplate: buildLoginResponseTemplate(this.config.attributeMapping),
      nameIDFormat: [nameIdFormat],
    });
  };

  protected buildSamlServiceProvider = (): saml.ServiceProviderInstance => {
    const { certificate: encryptCert, entityId, acsUrl } = this.buildSpConfig();
    // eslint-disable-next-line new-cap
    return saml.ServiceProvider({
      entityID: entityId,
      assertionConsumerService: [
        {
          Binding: acsUrl.binding,
          Location: acsUrl.url,
        },
      ],
      signingCert: this.config.certificate,
      authnRequestsSigned: this.idp.entityMeta.isWantAuthnRequestsSigned(),
      allowCreate: false,
      ...cond(encryptCert && { encryptCert }),
    });
  };

  protected getOidcConfig = async (): Promise<CamelCaseKeys<OidcConfigResponse>> => {
    const oidcConfig = await tryThat(
      async () => fetchOidcConfigRaw(this.issuer),
      (error) => {
        if (error instanceof ZodError) {
          throw new RequestError({
            code: 'oidc.invalid_request',
            message: error.message,
            error: error.flatten(),
          });
        }

        throw error;
      }
    );

    return oidcConfig;
  };

  protected exchangeAuthorizationCode = async ({ code }: { code: string }) => {
    const { tokenEndpoint } = await this.fetchOidcConfig();
    const result = await handleTokenExchange(tokenEndpoint, {
      code,
      clientId: this.samlApplicationId,
      clientSecret: this.config.secret,
      redirectUri: this.config.redirectUri,
    });

    if (!result.success) {
      throw new RequestError({
        code: 'oidc.invalid_token',
        message: 'Invalid token response',
      });
    }

    return camelcaseKeys(result.data);
  };

  protected async fetchOidcConfig() {
    this.oidcConfig ||= await this.getOidcConfig();

    return this.oidcConfig;
  }

  protected getUserInfo = async ({
    accessToken,
  }: {
    accessToken: string;
  }): Promise<IdTokenProfileStandardClaims & Record<string, unknown>> => {
    const { userinfoEndpoint } = await this.fetchOidcConfig();

    // We reuse the fetchOidcConfig function from SSO connector to fetch the OIDC config.
    // userinfo endpoint is not required in the OIDC config.
    // But it is mandatory in Logto OIDC flow. So we should always have a userinfo endpoint.
    assertThat(userinfoEndpoint, new Error('Userinfo endpoint is not available'));

    const body = await getRawUserInfoResponse(accessToken, userinfoEndpoint);
    const result = idTokenProfileStandardClaimsGuard
      .catchall(z.unknown())
      .safeParse(parseJson(body));

    if (!result.success) {
      throw new RequestError({
        code: 'oidc.invalid_request',
        message: 'Invalid user info response',
        details: result.error.flatten(),
      });
    }

    return result.data;
  };





  // Used to check whether xml content is valid in format.
  private setSchemaValidator() {
    saml.setSchemaValidator({
      validate: async (xmlContent: string) => {
        try {
          XMLValidator.validate(xmlContent, {
            allowBooleanAttributes: true,
          });

          return true;
        } catch {
          return false;
        }
      },
    });
  }

  private buildIdpConfig(): SamlIdentityProviderConfig {
    return {
      entityId: buildSamlIdentityProviderEntityId(this.endpoint, this.samlApplicationId),
      privateKey: this.config.privateKey,
      certificate: this.config.certificate,
      singleSignOnUrl: buildSingleSignOnUrl(this.endpoint, this.samlApplicationId),
      nameIdFormat: this.config.nameIdFormat,
      encryptSamlAssertion: this.config.encryption?.encryptAssertion ?? false,
    };
  }

  private buildSpConfig(): SamlServiceProviderConfig {
    return {
      entityId: this.config.spEntityId,
      acsUrl: this.config.acsUrl,
      certificate: this.config.encryption?.certificate,
    };
  }
}
/* eslint-enable max-lines */
