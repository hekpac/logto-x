import type { Log } from '@logto/schemas';
import { conditionalString } from '@silverhand/essentials';

import { authedApi } from './api.js';

export const getAuditLogs = async (params?: URLSearchParams) =>
  authedApi.get('logs?' + conditionalString(params?.toString())).json<Log[]>();

export const getWebhookRecentLogs = async (hookId: string, params?: URLSearchParams) =>
  authedApi
    .get(`hooks/${hookId}/recent-logs?` + conditionalString(params?.toString()))
    .json<Log[]>();

export const getLog = async (logId: string) => authedApi.get(`logs/${logId}`).json<Log>();
