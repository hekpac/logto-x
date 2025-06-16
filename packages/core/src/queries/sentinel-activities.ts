import type { SentinelActivity, SentinelActivityTargetType } from '@logto/schemas';
import { SentinelActivityModel } from '../models/sentinel-activity.js';

export const createSentinelActivitiesQueries = () => {
  const deleteActivities = async (
    targetType: SentinelActivityTargetType,
    targetHashes: string[]
  ) => {
    await SentinelActivityModel.deleteMany({
      targetType,
      targetHash: { $in: targetHashes },
      createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) },
    });
  };

  const countFailedAttempts = async (
    targetType: SentinelActivityTargetType,
    targetHash: string
  ) =>
    SentinelActivityModel.countDocuments({
      targetType,
      targetHash,
      actionResult: 'Failed',
      decision: { $ne: 'Blocked' },
      createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) },
    });

  const findBlocked = async (
    targetType: SentinelActivityTargetType,
    targetHash: string
  ) =>
    SentinelActivityModel.findOne({
      targetType,
      targetHash,
      decision: 'Blocked',
      decisionExpiresAt: { $gt: new Date() },
    })
      .lean<Pick<SentinelActivity, 'decisionExpiresAt'>>()
      .exec();

  const insertActivity = async (activity: SentinelActivity) => {
    await SentinelActivityModel.create(activity);
  };

  return { deleteActivities, countFailedAttempts, findBlocked, insertActivity };
};
