import { appInsights } from '@logto/app-insights/node';
import { ConnectorType, type SendMessagePayload, TemplateType } from '@logto/connector-kit';
import {
  OrganizationInvitationStatus,
  type CreateOrganizationInvitation,
  type OrganizationInvitationEntity,
} from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import { conditional, type Nullable, removeUndefinedKeys } from '@silverhand/essentials';

import RequestError from '#src/errors/RequestError/index.js';
import OrganizationQueries from '#src/queries/organization/index.js';
import { createUserQueries } from '#src/queries/user.js';
import type Queries from '#src/tenants/Queries.js';
import {
  buildOrganizationContextInfo,
  buildUserContextInfo,
} from '#src/utils/connectors/extra-information.js';
import { type OrganizationInvitationContextInfo } from '#src/utils/connectors/types.js';

import { type ConnectorLibrary } from './connector.js';

/**
 * The ending statuses of an organization invitation per RFC 0003. It means that the invitation
 * status cannot be changed anymore.
 */
const endingStatuses = Object.freeze([
  OrganizationInvitationStatus.Accepted,
  OrganizationInvitationStatus.Expired,
  OrganizationInvitationStatus.Revoked,
]);

/** Class for managing organization invitations. */
export class OrganizationInvitationLibrary {
  constructor(
    protected readonly tenantId: string,
    protected readonly queries: Queries,
    protected readonly connector: ConnectorLibrary
  ) {}

  /**
   * Creates a new organization invitation.
   *
   * Note: If the invitation email is not skipped, and the email cannot be sent, the transaction
   * will be rolled back.
   *
   * @param data Invitation data.
   * @param data.inviterId The user ID of the inviter.
   * @param data.invitee The email address of the invitee.
   * @param data.organizationId The ID of the organization to invite to.
   * @param data.expiresAt The epoch time in milliseconds when the invitation expires.
   * @param data.organizationRoleIds The IDs of the organization roles to assign to the invitee.
   * @param messagePayload The payload to send in the email. If it is `false`, the email will be
   * skipped.
   */
  async insert(
    data: Pick<
      CreateOrganizationInvitation,
      'inviterId' | 'invitee' | 'organizationId' | 'expiresAt'
    > & { organizationRoleIds?: string[] },
    messagePayload: SendMessagePayload | false
  ) {
    const { inviterId, invitee, organizationId, expiresAt, organizationRoleIds } = data;

    if (await this.queries.organizations.relations.users.isMember(organizationId, invitee)) {
      throw new RequestError({
        status: 422,
        code: 'organization_invitation.invitee_already_member',
      });
    }

    return this.queries.pool.transaction(async (connection) => {
      const organizationQueries = new OrganizationQueries(connection);
      // Check if any pending invitation has expired, if yes, update the invitation status to "Expired" first
      // Note: Even if the status may appear to be "Expired", the actual data in DB may still be "Pending".
      // Check `findEntities` in `OrganizationQueries` for more details.
      await organizationQueries.invitations.updateExpiredEntities({ invitee, organizationId });
      // Insert the new invitation
      const invitation = await organizationQueries.invitations.insert({
        id: generateStandardId(),
        inviterId,
        invitee,
        organizationId,
        status: OrganizationInvitationStatus.Pending,
        expiresAt,
      });

      if (organizationRoleIds?.length) {
        await organizationQueries.relations.invitationsRoles.insert(
          ...organizationRoleIds.map((roleId) => ({
            organizationInvitationId: invitation.id,
            organizationRoleId: roleId,
          }))
        );
      }

      if (messagePayload) {
        const templateContext = await this.getOrganizationInvitationTemplateContext(
          organizationId,
          inviterId
        );

        await this.sendEmail(invitee, {
          ...templateContext,
          ...messagePayload,
        });
      }

      // Additional query to get the full invitation data
      return organizationQueries.invitations.findById(invitation.id);
    });
  }

  /**
   * Revokes an organization invitation. The transaction will be rolled back if the status is one
   * of the ending statuses.
   *
   * @param id The ID of the invitation.
   * @param status The new status of the invitation.
   * @returns A promise that resolves to the updated invitation.
   * @see {@link endingStatuses} for the ending statuses.
   */
  async updateStatus(
    id: string,
    status: OrganizationInvitationStatus.Revoked
  ): Promise<OrganizationInvitationEntity>;
  /**
   * Updates the status of an organization invitation to `Accepted`, and assigns the user to the
   * organization with the provided roles in the invitation.
   *
   * The transaction will be rolled back if:
   * - The status is one of the ending statuses.
   * - The `acceptedUserId` is not provided.
   * - The `acceptedUserId` is not the same as the invitee.
   *
   * @param id The ID of the invitation.
   * @param status The new status of the invitation (`Accepted`).
   * @param acceptedUserId The user ID of the user who accepted the invitation.
   * @returns A promise that resolves to the updated invitation.
   * @see {@link endingStatuses} for the ending statuses.
   */
  async updateStatus(
    id: string,
    status: OrganizationInvitationStatus.Accepted,
    acceptedUserId: string
  ): Promise<OrganizationInvitationEntity>;
  async updateStatus(
    id: string,
    status: OrganizationInvitationStatus,
    acceptedUserId?: string
  ): Promise<OrganizationInvitationEntity> {
    const entity = await this.queries.organizations.invitations.findById(id);

    if (endingStatuses.includes(entity.status)) {
      throw new RequestError({
        status: 422,
        code: 'organization_invitation.status_unchangeable',
      });
    }

    return this.queries.pool.transaction(async (connection) => {
      const organizationQueries = new OrganizationQueries(connection);
      const userQueries = createUserQueries(connection);

      switch (status) {
        case OrganizationInvitationStatus.Accepted: {
          if (!acceptedUserId) {
            throw new RequestError({
              status: 422,
              code: 'organization_invitation.accepted_user_id_required',
            });
          }

          const user = await userQueries.findUserById(acceptedUserId);

          if (user.primaryEmail?.toLowerCase() !== entity.invitee.toLowerCase()) {
            throw new RequestError({
              status: 422,
              code: 'organization_invitation.accepted_user_email_mismatch',
            });
          }

          await organizationQueries.relations.users.insert({
            organizationId: entity.organizationId,
            userId: acceptedUserId,
          });

          if (entity.organizationRoles.length > 0) {
            await organizationQueries.relations.usersRoles.insert(
              ...entity.organizationRoles.map((role) => ({
                organizationId: entity.organizationId,
                organizationRoleId: role.id,
                userId: acceptedUserId,
              }))
            );
          }
          break;
        }
        case OrganizationInvitationStatus.Revoked: {
          break;
        }
        default: {
          throw new RequestError({
            status: 422,
            code: 'organization_invitation.unsupported_status',
            data: { status },
          });
        }
      }

      const updated = {
        status,
        acceptedUserId,
        updatedAt: Date.now(),
      };
      await organizationQueries.invitations.updateById(id, updated);

      return { ...entity, ...removeUndefinedKeys(updated) };
    });
  }

  async getOrganizationInvitationTemplateContext(
    organizationId: string,
    inviterId?: Nullable<string>
  ): Promise<OrganizationInvitationContextInfo> {
    try {
      const [organization, inviter] = await Promise.all([
        this.queries.organizations.findById(organizationId),
        inviterId ? this.queries.users.findUserById(inviterId) : undefined,
      ]);

      return {
        organization: buildOrganizationContextInfo(organization),
        ...conditional(
          inviter && {
            inviter: buildUserContextInfo(inviter),
          }
        ),
      };
    } catch (error: unknown) {
      void appInsights.trackException(error);

      // Should not block the verification code sending if the context information is not available.
      return {};
    }
  }

  /** Send an organization invitation email. */
  async sendEmail(to: string, payload: SendMessagePayload & OrganizationInvitationContextInfo) {
    const emailConnector = await this.connector.getMessageConnector(ConnectorType.Email);
    return emailConnector.sendMessage({
      to,
      type: TemplateType.OrganizationInvitation,
      payload,
    });
  }
}
