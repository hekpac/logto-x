const organization_invitation = {
  invitee_already_member: 'The invitee is already a member of the organization.',
  status_unchangeable: 'The status of the invitation cannot be changed anymore.',
  accepted_user_email_mismatch: 'The accepted user must have the same email as the invitee.',
  accepted_user_id_required: 'The `acceptedUserId` is required when accepting an invitation.',
  expires_at_future_required: 'The value of `expiresAt` must be in the future.',
  unsupported_status: 'Unsupported status: {{status}}.',
};

export default Object.freeze(organization_invitation);
