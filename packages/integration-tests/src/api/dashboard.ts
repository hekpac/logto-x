import { authedApi } from './api.js';

export type StatisticsData = {
  count: number;
  delta: number;
};

export type TotalUserCountData = {
  totalUserCount: number;
};

export type NewUserStatistics = {
  today: StatisticsData;
  last7Days: StatisticsData;
};

export type ActiveUserStatistics = {
  dauCurve: StatisticsData[];
  dau: StatisticsData;
  wau: StatisticsData;
  mau: StatisticsData;
};

export const getTotalUsersCount = async () =>
  authedApi.get('dashboard/users/total').json<TotalUserCountData>();

export const getNewUsersData = async () =>
  authedApi.get('dashboard/users/new').json<NewUserStatistics>();

export const getActiveUsersData = async () =>
  authedApi.get('dashboard/users/active').json<ActiveUserStatistics>();
