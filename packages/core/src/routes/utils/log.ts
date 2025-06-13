import type { Log } from '@logto/schemas';

import type { AllowedKeyPrefix } from '#src/queries/log.js';

export type LogSearchParams = {
  userId?: string;
  applicationId?: string;
  logKey?: string;
};

export type LogSearchCondition = {
  logKey?: string;
  payload?: { applicationId?: string; userId?: string; hookId?: string };
  startTimeExclusive?: number;
  includeKeyPrefix?: AllowedKeyPrefix[];
};

export const parseLogSearchParams = (
  searchParams: URLSearchParams
): LogSearchParams => ({
  userId: searchParams.get('userId') ?? undefined,
  applicationId: searchParams.get('applicationId') ?? undefined,
  logKey: searchParams.get('logKey') ?? undefined,
});

export const buildLogCondition = (
  searchParams: URLSearchParams,
  base: LogSearchCondition = {}
): LogSearchCondition => {
  const { userId, applicationId, logKey } = parseLogSearchParams(searchParams);

  return {
    ...base,
    logKey: base.logKey ?? logKey,
    payload: { userId, applicationId, ...base.payload },
  };
};

export const fetchLogsWithPagination = async (
  queries: {
    countLogs: (condition: LogSearchCondition) => Promise<{ count: number }>;
    findLogs: (
      limit: number,
      offset: number,
      condition: LogSearchCondition
    ) => Promise<Log[]>;
  },
  pagination: { limit: number; offset: number },
  searchParams: URLSearchParams,
  baseCondition: LogSearchCondition = {}
) => {
  const condition = buildLogCondition(searchParams, baseCondition);
  const [{ count }, logs] = await Promise.all([
    queries.countLogs(condition),
    queries.findLogs(pagination.limit, pagination.offset, condition),
  ]);

  return { count, logs } as const;
};
