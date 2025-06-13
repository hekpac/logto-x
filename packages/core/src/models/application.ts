import mongoose from 'mongoose';
import { ApplicationType } from '@logto/schemas';

const ApplicationSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  secret: { type: String, required: true },
  description: String,
  type: { type: String, enum: Object.values(ApplicationType), required: true },
  oidcClientMetadata: { type: Object, required: true },
  customClientMetadata: { type: Object, default: {} },
  protectedAppMetadata: { type: Object },
  customData: { type: Object, default: {} },
  isThirdParty: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const ApplicationModel = mongoose.model('Application', ApplicationSchema);
