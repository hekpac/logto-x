export enum LogtoSkuType {
  Basic = 'Basic',
  AddOn = 'AddOn',
}

export interface NewSubscriptionQuota {
  mauLimit: number | null;
  tokenLimit: number | null;
  applicationsLimit: number | null;
  machineToMachineLimit: number | null;
  resourcesLimit: number | null;
  scopesPerResourceLimit: number | null;
  socialConnectorsLimit: number | null;
  userRolesLimit: number | null;
  machineToMachineRolesLimit: number | null;
  scopesPerRoleLimit: number | null;
  hooksLimit: number | null;
  auditLogsRetentionDays: number | null;
  mfaEnabled: boolean;
  organizationsLimit: number | null;
  enterpriseSsoLimit: number | null;
  thirdPartyApplicationsLimit: number | null;
  tenantMembersLimit: number | null;
  customJwtEnabled: boolean;
  subjectTokenEnabled: boolean;
  bringYourUiEnabled: boolean;
  idpInitiatedSsoEnabled: boolean;
  samlApplicationsLimit: number | null;
  captchaEnabled: boolean;
  securityFeaturesEnabled: boolean;
}

export interface LogtoSkuQuota extends NewSubscriptionQuota {
  ticketSupportResponseTime: number;
}

export type LogtoSkuQuotaEntries = Array<[
  keyof LogtoSkuQuota,
  LogtoSkuQuota[keyof LogtoSkuQuota]
]>;
