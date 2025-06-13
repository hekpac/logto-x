export type LogSearchParams = {
  userId?: string;
  applicationId?: string;
  logKey?: string;
};

export const parseLogSearchParams = (
  searchParams: URLSearchParams
): LogSearchParams => {
  const userId = searchParams.get('userId') ?? undefined;
  const applicationId = searchParams.get('applicationId') ?? undefined;
  const logKey = searchParams.get('logKey') ?? undefined;

  return { userId, applicationId, logKey };
};
