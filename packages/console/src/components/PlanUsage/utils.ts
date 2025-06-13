import { type TFuncKey } from 'i18next';
import { useMemo } from 'react';

import { type NewSubscriptionQuota } from '@/cloud/types/router';
import useAddOnPricing from '@/hooks/use-add-on-pricing';

export type UsageKey = Pick<
  NewSubscriptionQuota,
  | 'mauLimit'
  | 'organizationsLimit'
  | 'mfaEnabled'
  | 'enterpriseSsoLimit'
  | 'resourcesLimit'
  | 'machineToMachineLimit'
  | 'tenantMembersLimit'
  | 'tokenLimit'
  | 'hooksLimit'
  | 'securityFeaturesEnabled'
>;

// We decide not to show `hooksLimit` usage in console for now.
export const usageKeys: Array<keyof UsageKey> = [
  'mauLimit',
  'organizationsLimit',
  'mfaEnabled',
  'enterpriseSsoLimit',
  'resourcesLimit',
  'machineToMachineLimit',
  'tenantMembersLimit',
  'tokenLimit',
  'securityFeaturesEnabled',
];

export const useUsageKeyPriceMap = (): Record<keyof UsageKey, number> => {
  const { data } = useAddOnPricing();

  return useMemo(
    () => ({
      mauLimit: 0,
      organizationsLimit: data.organizationsLimit,
      mfaEnabled: data.mfaEnabled,
      enterpriseSsoLimit: data.enterpriseSsoLimit,
      resourcesLimit: data.resourcesLimit,
      machineToMachineLimit: data.machineToMachineLimit,
      tenantMembersLimit: data.tenantMembersLimit,
      tokenLimit: data.tokenLimit,
      hooksLimit: data.hooksLimit,
      securityFeaturesEnabled: data.securityFeaturesEnabled,
    }),
    [data]
  );
};

export const titleKeyMap: Record<
  keyof UsageKey,
  TFuncKey<'translation', 'admin_console.subscription.usage'>
> = {
  mauLimit: 'mau.title',
  organizationsLimit: 'organizations.title',
  mfaEnabled: 'mfa.title',
  enterpriseSsoLimit: 'enterprise_sso.title',
  resourcesLimit: 'api_resources.title',
  machineToMachineLimit: 'machine_to_machine.title',
  tenantMembersLimit: 'tenant_members.title',
  tokenLimit: 'tokens.title',
  hooksLimit: 'hooks.title',
  securityFeaturesEnabled: 'security_features.title',
};

export const tooltipKeyMap: Record<
  keyof UsageKey,
  TFuncKey<'translation', 'admin_console.subscription.usage'>
> = {
  mauLimit: 'mau.tooltip',
  organizationsLimit: 'organizations.tooltip',
  mfaEnabled: 'mfa.tooltip',
  enterpriseSsoLimit: 'enterprise_sso.tooltip',
  resourcesLimit: 'api_resources.tooltip',
  machineToMachineLimit: 'machine_to_machine.tooltip',
  tenantMembersLimit: 'tenant_members.tooltip',
  tokenLimit: 'tokens.tooltip',
  hooksLimit: 'hooks.tooltip',
  securityFeaturesEnabled: 'security_features.tooltip',
};

export const enterpriseTooltipKeyMap: Record<
  keyof UsageKey,
  TFuncKey<'translation', 'admin_console.subscription.usage'>
> = {
  mauLimit: 'mau.tooltip_for_enterprise',
  organizationsLimit: 'organizations.tooltip_for_enterprise',
  mfaEnabled: 'mfa.tooltip_for_enterprise',
  enterpriseSsoLimit: 'enterprise_sso.tooltip_for_enterprise',
  resourcesLimit: 'api_resources.tooltip_for_enterprise',
  machineToMachineLimit: 'machine_to_machine.tooltip_for_enterprise',
  tenantMembersLimit: 'tenant_members.tooltip_for_enterprise',
  tokenLimit: 'tokens.tooltip_for_enterprise',
  hooksLimit: 'hooks.tooltip_for_enterprise',
  securityFeaturesEnabled: 'security_features.tooltip',
};

export const formatNumber = (number: number): string => {
  return number.toString().replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',');
};
