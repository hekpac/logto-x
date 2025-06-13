import { ReservedPlanId } from '@logto/schemas';

/**
 * Shared quota limits between the featured plan content in the `CreateTenantModal` and the `PlanComparisonTable`.
 */
export const freePlanMauLimit = 50_000;
export const freePlanM2mLimit = 1;
export const freePlanRoleLimit = 1;
export const freePlanPermissionsLimit = 1;
export const freePlanAuditLogsRetentionDays = 3;
export const proPlanAuditLogsRetentionDays = 14;

/**
 * In console, only featured plans are shown in the plan selection component.
 * we will this to filter out the public visible featured plans.
 */
export const featuredPlanIds: readonly string[] = Object.freeze([
  ReservedPlanId.Free,
  ReservedPlanId.Pro202411,
]);

/**
 * The order of plans in the plan selection content component.
 * Unlike the `featuredPlanIds`, include both grandfathered plans and public visible featured plans.
 * We need to properly identify the order of the grandfathered plans compared to the new public visible featured plans.
 */
export const planIdOrder: Record<string, number> = Object.freeze({
  [ReservedPlanId.Free]: 0,
  [ReservedPlanId.Pro]: 1,
  [ReservedPlanId.Pro202411]: 1,
});

export const checkoutStateQueryKey = 'checkout-state';

/** The latest pro plan id we are using. */
export const latestProPlanId = ReservedPlanId.Pro202411;
