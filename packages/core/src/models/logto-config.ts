import mongoose from 'mongoose';
import { LogtoTenantConfigKey } from '@logto/schemas';

const LogtoConfigSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  key: { type: String, enum: Object.values(LogtoTenantConfigKey), required: true },
  value: { type: mongoose.Schema.Types.Mixed }
});

export const LogtoConfigModel = mongoose.model('LogtoConfig', LogtoConfigSchema);
