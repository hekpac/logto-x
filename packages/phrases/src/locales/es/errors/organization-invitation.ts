const organization_invitation = {
  invitee_already_member: 'El invitado ya es miembro de la organización.',
  status_unchangeable: 'El estado de la invitación ya no puede cambiarse.',
  accepted_user_email_mismatch: 'El usuario que acepta debe tener el mismo correo electrónico que el invitado.',
  accepted_user_id_required: 'The `acceptedUserId` is required when accepting an invitation.',
  expires_at_future_required: 'The value of `expiresAt` must be in the future.',
  unsupported_status: 'Unsupported status: {{status}}.',
};

export default Object.freeze(organization_invitation);
