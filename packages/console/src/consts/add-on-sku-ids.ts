export const addOnSkuIdMap = {
  resourcesLimit: 'api_resource',
  machineToMachineLimit: 'machine_to_machine',
  tenantMembersLimit: 'tenant_member',
  mfaEnabled: 'mfa',
  enterpriseSsoLimit: 'enterprise_sso',
  organizationsLimit: 'organization',
  tokenLimit: 'token_usage',
  hooksLimit: 'hooks',
  securityFeaturesEnabled: 'security_features',
} as const;

export type AddOnUsageKey = keyof typeof addOnSkuIdMap;

export const addOnSkuIds = Object.values(addOnSkuIdMap);
