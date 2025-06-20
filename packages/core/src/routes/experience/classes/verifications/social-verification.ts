import {
  type ConnectorSession,
  type SocialUserInfo,
  ConnectorType,
  type SocialConnector,
  GoogleConnector,
} from '@logto/connector-kit';
import {
  VerificationType,
  type JsonObject,
  type SocialAuthorizationUrlPayload,
  type User,
  type SocialVerificationRecordData,
  socialVerificationRecordDataGuard,
} from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import { conditional } from '@silverhand/essentials';

import RequestError from '#src/errors/RequestError/index.js';
import { type WithLogContext } from '#src/middleware/koa-audit-log.js';
import {
  verifySocialIdentity,
  assignConnectorSessionResult,
  createSocialAuthorizationSession,
  verifySocialIdentityInternally,
} from '../utils/verification/social-verification.js';
import type Libraries from '#src/tenants/Libraries.js';
import type Queries from '#src/tenants/Queries.js';
import type TenantContext from '#src/tenants/TenantContext.js';
import assertThat from '#src/utils/assert-that.js';
import { type LogtoConnector } from '#src/utils/connectors/types.js';

import type { InteractionProfile } from '../../types.js';

import { type IdentifierVerificationRecord } from './verification-record.js';

export {
  type SocialVerificationRecordData,
  socialVerificationRecordDataGuard,
} from '@logto/schemas';

type SocialAuthorizationSessionStorageType = 'interactionSession' | 'verificationRecord';

export class SocialVerification implements IdentifierVerificationRecord<VerificationType.Social> {
  /**
   * Factory method to create a new SocialVerification instance
   */
  static create(libraries: Libraries, queries: Queries, connectorId: string) {
    return new SocialVerification(libraries, queries, {
      id: generateStandardId(),
      connectorId,
      type: VerificationType.Social,
    });
  }

  public readonly id: string;
  public readonly type = VerificationType.Social;
  public readonly connectorId: string;
  public socialUserInfo?: SocialUserInfo;
  public connectorSession: ConnectorSession;
  private connectorDataCache?: LogtoConnector;

  constructor(
    private readonly libraries: Libraries,
    private readonly queries: Queries,
    data: SocialVerificationRecordData
  ) {
    const { id, connectorId, socialUserInfo, connectorSession } =
      socialVerificationRecordDataGuard.parse(data);

    this.id = id;
    this.connectorId = connectorId;
    this.socialUserInfo = socialUserInfo;
    this.connectorSession = connectorSession ?? {};
  }

  /**
   * Returns true if the social identity has been verified
   */
  get isVerified() {
    return Boolean(this.socialUserInfo);
  }

  /**
   * Create the authorization URL for the social connector and generate a connector authorization session.
   *
   * @param {SocialAuthorizationSessionStorageType} connectorSessionType  - Whether to store the connector session result in the current verification record directly. Set to `true` for the profile API.
   *
   * @remarks
   * For the experience API:
   * The authorization URL is generated and the connector session result is stored in the provider interaction details.
   * This is mainly for legacy social connectors that still rely on the OIDC interaction context.
   * SAML connectors now store the session in the verification record instead.
   *
   * For the profile API:
   * This method calls the internal {@link createSocialAuthorizationSession} method to create a social authorization session.
   * The connector session result is stored in the current verification record directly.
   * The social verification flow does not rely on the OIDC interaction context.
   *
   * The goal is to align both experience and profile APIs with the
   * {@link createSocialAuthorizationSession} approach so the connector session
   * is stored in the verification record.
  */
  async createAuthorizationUrl(
    ctx: WithLogContext,
    tenantContext: TenantContext,
    { state, redirectUri }: SocialAuthorizationUrlPayload,
    connectorSessionType: SocialAuthorizationSessionStorageType = 'interactionSession'
  ) {
    // For the profile API, connector session result is stored in the current verification record directly.
    if (connectorSessionType === 'verificationRecord') {
      const connector = await this.getConnectorData();
      return createSocialAuthorizationSession(
        ctx,
        connector,
        this.connectorId,
        this.id,
        { state, redirectUri },
        async (session) => {
          this.connectorSession = session;
        }
      );
    }

    // For the experience API, connector session result is stored in the provider's interactionDetails.
    const {
      provider,
      connectors: { getLogtoConnectorById },
    } = tenantContext;

    const connector = await getLogtoConnectorById(this.connectorId);

    assertThat(connector.type === ConnectorType.Social, 'connector.unexpected_type');

    const {
      headers: { 'user-agent': userAgent },
    } = ctx.request;

    const { jti } = await provider.interactionDetails(ctx.req, ctx.res);

    return connector.getAuthorizationUri(
      {
        state,
        redirectUri,
        connectorId: this.connectorId,
        connectorFactoryId: connector.metadata.id,
        jti,
        headers: { userAgent },
      },
      async (connectorSession: ConnectorSession) =>
        assignConnectorSessionResult(ctx, provider, connectorSession)
    );
  }

  /**
   * Verify the social identity and store the social identity in the verification record.
   *
   * @param {SocialAuthorizationSessionStorageType} connectorSessionType  - Whether to find the connector session result from the current verification record directly. Set to `true` for the profile API.
   *
   * @remarks
   * For the experience API:
   * This method directly calls the {@link verifySocialIdentity} method in the
   * experience/utils/verification/social-verification.ts file.
   * Fetch the connector session result from the provider's interactionDetails and verify the social identity.
   * For compatibility reasons, we keep using the old {@link verifySocialIdentity} method here as a single source of truth.
   * See the above {@link createAuthorizationUrl} method for more details.
   *
   * For the profile API:
   * This method calls the internal {@link verifySocialIdentityInternally} method to verify the social identity.
   * The connector session result is fetched from the current verification record directly.
   *
   */
  async verify(
    ctx: WithLogContext,
    tenantContext: TenantContext,
    connectorData: JsonObject,
    connectorSessionType: SocialAuthorizationSessionStorageType = 'interactionSession'
  ) {
    const socialUserInfo =
      connectorSessionType === 'verificationRecord'
        ? await verifySocialIdentityInternally(
            connectorData,
            ctx,
            await this.getConnectorData(),
            this.connectorSession,
            this.connectorId,
            this.libraries.socials.getUserInfo
          )
        : await verifySocialIdentity(
            { connectorId: this.connectorId, connectorData },
            ctx,
            tenantContext
          );

    this.socialUserInfo = socialUserInfo;
  }

  /**
   * Identify the user by the social identity.
   * If the user is not found, find the related user by the social identity and throw an error.
   */
  async identifyUser(): Promise<User> {
    assertThat(
      this.isVerified,
      new RequestError({ code: 'session.verification_failed', status: 400 })
    );

    const user = await this.findUserBySocialIdentity();

    if (!user) {
      const relatedUser = await this.findRelatedUserBySocialIdentity();

      throw new RequestError(
        {
          code: 'user.identity_not_exist',
          status: 404,
        },
        {
          ...(relatedUser && { relatedUser: relatedUser[0] }),
        }
      );
    }

    return user;
  }

  async identifyRelatedUser(): Promise<User> {
    assertThat(
      this.isVerified,
      new RequestError({ code: 'session.verification_failed', status: 400 })
    );

    const relatedUser = await this.findRelatedUserBySocialIdentity();

    assertThat(relatedUser, new RequestError({ code: 'user.identity_not_exist', status: 404 }));

    return relatedUser[1];
  }

  /**
   * Returns the social identity as a new user profile.
   */
  async toUserProfile(): Promise<Required<Pick<InteractionProfile, 'socialIdentity'>>> {
    assertThat(
      this.socialUserInfo,
      new RequestError({ code: 'session.verification_failed', status: 400 })
    );

    const {
      metadata: { target },
    } = await this.getConnectorData();

    return {
      socialIdentity: {
        target,
        userInfo: this.socialUserInfo,
      },
    };
  }

  /**
   * Returns the synced profile from the social identity.
   *
   * @param isNewUser - Whether the profile is for a new user. Only return the primary email/phone if it is a new user.
   */
  async toSyncedProfile(
    isNewUser = false
  ): Promise<Pick<InteractionProfile, 'avatar' | 'name' | 'primaryEmail' | 'primaryPhone'>> {
    assertThat(
      this.socialUserInfo,
      new RequestError({ code: 'session.verification_failed', status: 400 })
    );

    const { name, avatar, email: primaryEmail, phone: primaryPhone } = this.socialUserInfo;

    if (isNewUser) {
      const {
        users: { hasUserWithEmail, hasUserWithNormalizedPhone },
      } = this.queries;

      return {
        // Sync the email only if the email is not used by other users
        ...conditional(primaryEmail && !(await hasUserWithEmail(primaryEmail)) && { primaryEmail }),
        // Sync the phone only if the phone is not used by other users
        ...conditional(
          primaryPhone && !(await hasUserWithNormalizedPhone(primaryPhone)) && { primaryPhone }
        ),
        ...conditional(name && { name }),
        ...conditional(avatar && { avatar }),
      };
    }

    const {
      dbEntry: { syncProfile },
    } = await this.getConnectorData();

    return syncProfile
      ? {
          ...conditional(name && { name }),
          ...conditional(avatar && { avatar }),
        }
      : {};
  }

  toJson(): SocialVerificationRecordData {
    const { id, connectorId, type, socialUserInfo, connectorSession } = this;

    return {
      id,
      connectorId,
      type,
      socialUserInfo,
      connectorSession,
    };
  }

  private async findUserBySocialIdentity(): Promise<User | undefined> {
    const {
      users: { findUserByIdentity },
    } = this.queries;

    if (!this.socialUserInfo) {
      return;
    }

    const {
      metadata: { target },
    } = await this.getConnectorData();

    const user = await findUserByIdentity(target, this.socialUserInfo.id);

    return user ?? undefined;
  }

  /**
   * Find the related user using the social identity's verified email or phone number.
   */
  private async findRelatedUserBySocialIdentity(): ReturnType<
    typeof socials.findSocialRelatedUser
  > {
    const { socials } = this.libraries;

    if (!this.socialUserInfo) {
      return null;
    }

    return socials.findSocialRelatedUser(this.socialUserInfo);
  }

  private async getConnectorData(): Promise<LogtoConnector<SocialConnector>> {
    const { getConnector } = this.libraries.socials;

    this.connectorDataCache ||= await getConnector(this.connectorId);

    assertThat(this.connectorDataCache.type === ConnectorType.Social, 'connector.unexpected_type');

    return this.connectorDataCache;
  }

  /**
   * Internal method to create a social authorization session.
   *
   * @remarks
   * Generate the social authorization URL and store the connector session result
   * in the current verification record directly.
   * This social connector session result will be used to verify the social response later.
   * This method can be used for both experience and profile APIs, w/o OIDC interaction context.
   *
   */
}
