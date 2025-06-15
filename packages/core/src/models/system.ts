import mongoose from 'mongoose';
import type { SystemKey } from '@logto/schemas';

const SystemSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
});

export const SystemModel = mongoose.model('System', SystemSchema);
