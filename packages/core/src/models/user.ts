import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  username: String,
  primaryEmail: String,
  primaryPhone: String,
  passwordEncrypted: String,
  name: String,
  avatar: String,
  profile: { type: Object, default: {} },
  applicationId: String,
  identities: { type: Object, default: {} },
  customData: { type: Object, default: {} },
  logtoConfig: { type: Object, default: {} },
  unverifiedEmails: { type: Array, default: [] },
  mfaVerifications: { type: Array, default: [] },
  isSuspended: { type: Boolean, default: false },
  lastSignInAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.model('User', UserSchema);
