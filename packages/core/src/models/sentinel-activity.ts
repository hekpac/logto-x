import mongoose from 'mongoose';
import {
  SentinelActivityTargetType,
  SentinelActivityAction,
  SentinelActionResult,
  SentinelDecision,
} from '@logto/schemas';

const SentinelActivitySchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  targetType: {
    type: String,
    enum: Object.values(SentinelActivityTargetType),
    required: true,
  },
  targetHash: { type: String, required: true },
  action: {
    type: String,
    enum: Object.values(SentinelActivityAction),
    required: true,
  },
  actionResult: {
    type: String,
    enum: Object.values(SentinelActionResult),
    required: true,
  },
  payload: { type: Object, default: {} },
  decision: {
    type: String,
    enum: Object.values(SentinelDecision),
    required: true,
  },
  decisionExpiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const SentinelActivityModel = mongoose.model('SentinelActivity', SentinelActivitySchema);
