import {
  type ActivityReport,
  Sentinel,
  SentinelDecision,
  type SentinelDecisionTuple,
  type SentinelActivity,
  SentinelActivityAction,
  SentinelActionResult,
  defaultSentinelPolicy,
} from '@logto/schemas';
import { generateStandardId } from '@logto/shared';
import { type Nullable } from '@silverhand/essentials';
import { addMinutes } from 'date-fns';

import type Queries from '#src/tenants/Queries.js';
import { createSentinelActivitiesQueries } from '#src/queries/sentinel-activities.js';


/**
 * A basic sentinel that blocks a user after 5 failed attempts in 1 hour.
 *
 * @see {@link BasicSentinel.supportedActions} for the list of supported actions.
 */
export default class BasicSentinel extends Sentinel {
  /** The list of actions that are accepted to be reported to this sentinel. */
  static supportedActions = Object.freeze([
    SentinelActivityAction.Password,
    SentinelActivityAction.VerificationCode,
    SentinelActivityAction.OneTimeToken,
  ] as const);

  /** Helper for queries */
  static supportedActionArray = BasicSentinel.supportedActions;

  /**
   * Asserts that the given action is supported by this sentinel.
   *
   * @throws {Error} If the action is not supported.
   */
  static assertAction(action: unknown): asserts action is SentinelActivityAction {
    // eslint-disable-next-line no-restricted-syntax
    if (!BasicSentinel.supportedActions.includes(action as SentinelActivityAction)) {
      // Update to use the new error class later.
      throw new Error(`Unsupported action: ${String(action)}`);
    }
  }

  protected readonly sentinelActivities = createSentinelActivitiesQueries();

  /**
   * Init a basic sentinel with the tenant-level queries. We don't directly put the queries in the
   * `TenantContext` because the sentinel is designed to be used as an isolated module that can be
   * separated from the core business logic.
   *
   * @param queries Tenant-level queries.
   */
  constructor(protected readonly queries: Queries) {
    super();
  }

  /**
   * Reports an activity to this sentinel. The sentinel will decide whether to block the user or
   * not.
   *
   * Regardless of the decision, the activity will be recorded in the database.
   *
   * @param activity The activity to report.
   * @returns The decision made by the sentinel.
   * @throws {Error} If the action is not supported.
   * @see {@link BasicSentinel.supportedActions} for the list of supported actions.
   */
  async reportActivity(activity: ActivityReport): Promise<SentinelDecisionTuple> {
    BasicSentinel.assertAction(activity.action);

    const [decision, decisionExpiresAt] = await this.decide(activity);

    await this.sentinelActivities.insertActivity({
      id: generateStandardId(),
      ...activity,
      decision,
      decisionExpiresAt: new Date(decisionExpiresAt),
    });

    return [decision, decisionExpiresAt];
  }

  /**
   * Checks whether the given target is blocked from performing actions.
   *
   * @returns The decision made by the sentinel, or `null` if the target is not blocked.
   *
   * @remarks
   * All supported actions share the same pool of activities, i.e. once a user has failed to
   * perform any of the supported actions for certain times, the user will be blocked from
   * performing any of the supported actions.
   */
  protected async isBlocked(
    query: Pick<SentinelActivity, 'targetType' | 'targetHash'>
  ): Promise<Nullable<SentinelDecisionTuple>> {
    const blocked = await this.sentinelActivities.findBlocked(
      query.targetType,
      query.targetHash
    );

    return blocked
      ? [SentinelDecision.Blocked, blocked.decisionExpiresAt.getTime()]
      : null;
  }

  protected async getSentinelPolicy() {
    const {
      signInExperiences: { findDefaultSignInExperience },
    } = this.queries;

    const { sentinelPolicy } = await findDefaultSignInExperience();

    return {
      ...defaultSentinelPolicy,
      ...sentinelPolicy,
    };
  }

  protected async decide(
    query: Pick<SentinelActivity, 'targetType' | 'targetHash' | 'actionResult'>
  ): Promise<SentinelDecisionTuple> {
    const blocked = await this.isBlocked(query);

    if (blocked) {
      return blocked;
    }

    const failedAttempts = await this.sentinelActivities.countFailedAttempts(
      query.targetType,
      query.targetHash
    );

    const { maxAttempts, lockoutDuration } = await this.getSentinelPolicy();

    const now = new Date();

    return failedAttempts + (query.actionResult === SentinelActionResult.Failed ? 1 : 0) >=
      maxAttempts
      ? [SentinelDecision.Blocked, addMinutes(now, lockoutDuration).valueOf()]
      : [SentinelDecision.Allowed, now.valueOf()];
  }
}
