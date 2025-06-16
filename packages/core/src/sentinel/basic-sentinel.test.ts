import {
  type ActivityReport,
  SentinelActionResult,
  SentinelActivityAction,
  SentinelActivityTargetType,
  SentinelDecision,
} from '@logto/schemas';
import { addMinutes } from 'date-fns';

import { jest } from '@jest/globals';

import { mockSignInExperience } from '../__mocks__/sign-in-experience.js';
import { MockQueries } from '../test-utils/tenant.js';

import BasicSentinel from './basic-sentinel.js';

const createMockActivityReport = (): ActivityReport => ({
  targetType: SentinelActivityTargetType.User,
  targetHash: 'baz',
  action: SentinelActivityAction.Password,
  actionResult: SentinelActionResult.Success,
  payload: {},
});

class TestSentinel extends BasicSentinel {
  override decide = super.decide;
}

const findDefaultSignInExperienceMock = jest.fn();

const sentinel = new TestSentinel(
  new MockQueries({
    signInExperiences: {
      findDefaultSignInExperience: findDefaultSignInExperienceMock,
    },
  })
);
// Mock sentinelActivities
(sentinel as unknown as { sentinelActivities: any }).sentinelActivities = {
  insertActivity: jest.fn(),
  findBlocked: jest.fn(),
  countFailedAttempts: jest.fn(),
};
const mockedTime = new Date('2021-01-01T00:00:00.000Z').valueOf();
const mockedDefaultBlockedTime = addMinutes(mockedTime, 60).valueOf();

const customSentinelPolicy = {
  maxAttempts: 7,
  lockoutDuration: 15,
};

const mockedCustomBlockedTime = addMinutes(
  mockedTime,
  customSentinelPolicy.lockoutDuration
).valueOf();

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(mockedTime);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('BasicSentinel -> reportActivity()', () => {
  beforeEach(() => {
    findDefaultSignInExperienceMock.mockResolvedValue(mockSignInExperience);
  });

  it('should insert an activity', async () => {
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce(null);
    (sentinel as any).sentinelActivities.countFailedAttempts.mockResolvedValueOnce(0);

    const activity = createMockActivityReport();
    const decision = await sentinel.reportActivity(activity);

    expect(decision).toStrictEqual([SentinelDecision.Allowed, mockedTime]);
    expect((sentinel as any).sentinelActivities.insertActivity).toHaveBeenCalledTimes(1);
  });

  it('should insert a blocked activity', async () => {
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce({
      decisionExpiresAt: new Date(mockedDefaultBlockedTime),
    });

    const activity = createMockActivityReport();
    const decision = await sentinel.reportActivity(activity);
    expect(decision).toEqual([SentinelDecision.Blocked, mockedDefaultBlockedTime]);
    expect((sentinel as any).sentinelActivities.insertActivity).toHaveBeenCalledTimes(1);
  });
});

describe('BasicSentinel -> decide()', () => {
  beforeEach(() => {
    findDefaultSignInExperienceMock.mockResolvedValue(mockSignInExperience);
  });

  it('should return existing blocked time if the activity is blocked', async () => {
    const existingBlockedTime = addMinutes(mockedTime, 5).valueOf();
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce({
      decisionExpiresAt: new Date(existingBlockedTime),
    });

    const activity = createMockActivityReport();
    const decision = await sentinel.decide(activity);
    expect(decision).toEqual([SentinelDecision.Blocked, existingBlockedTime]);
  });

  it('should return allowed if the activity is not blocked and there are less than 100 failed attempts', async () => {
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce(null);
    (sentinel as any).sentinelActivities.countFailedAttempts.mockResolvedValueOnce(99);

    const activity = createMockActivityReport();
    const decision = await sentinel.decide(activity);
    expect(decision).toEqual([SentinelDecision.Allowed, mockedTime]);
  });

  it('should return blocked if the activity is not blocked and there are 100 failed attempts', async () => {
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce(null);
    (sentinel as any).sentinelActivities.countFailedAttempts.mockResolvedValueOnce(100);

    const activity = createMockActivityReport();
    const decision = await sentinel.decide(activity);
    expect(decision).toEqual([SentinelDecision.Blocked, mockedDefaultBlockedTime]);
  });

  it('should return blocked if the activity is not blocked and there are 99 failed attempts and the current activity is failed', async () => {
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce(null);
    (sentinel as any).sentinelActivities.countFailedAttempts.mockResolvedValueOnce(99);

    const activity = createMockActivityReport();
    // eslint-disable-next-line @silverhand/fp/no-mutation
    activity.actionResult = SentinelActionResult.Failed;
    const decision = await sentinel.decide(activity);
    expect(decision).toEqual([SentinelDecision.Blocked, mockedDefaultBlockedTime]);
  });
});

describe('BasicSentinel  with custom policy', () => {
  beforeEach(() => {
    findDefaultSignInExperienceMock.mockResolvedValue({
      ...mockSignInExperience,
      sentinelPolicy: customSentinelPolicy,
    });
  });

  it('should insert an activity', async () => {
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce(null);
    (sentinel as any).sentinelActivities.countFailedAttempts.mockResolvedValueOnce(0);

    const activity = createMockActivityReport();
    const decision = await sentinel.reportActivity(activity);

    expect(decision).toStrictEqual([SentinelDecision.Allowed, mockedTime]);
    expect((sentinel as any).sentinelActivities.insertActivity).toHaveBeenCalledTimes(1);
  });

  it('should insert a blocked activity', async () => {
    // Mock the query method to return a blocked activity
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce({
      decisionExpiresAt: new Date(mockedCustomBlockedTime),
    });

    const activity = createMockActivityReport();
    const decision = await sentinel.reportActivity(activity);
    expect(decision).toEqual([SentinelDecision.Blocked, mockedCustomBlockedTime]);
    expect((sentinel as any).sentinelActivities.insertActivity).toHaveBeenCalledTimes(1);
  });

  it('should return existing blocked time if the activity is blocked', async () => {
    const existingBlockedTime = addMinutes(mockedTime, 5).valueOf();
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce({
      decisionExpiresAt: new Date(existingBlockedTime),
    });

    const activity = createMockActivityReport();
    const decision = await sentinel.decide(activity);
    expect(decision).toEqual([SentinelDecision.Blocked, existingBlockedTime]);
  });

  it('should return allowed if the activity is not blocked and there are less than 7 failed attempts', async () => {
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce(null);
    (sentinel as any).sentinelActivities.countFailedAttempts.mockResolvedValueOnce(6);

    const activity = createMockActivityReport();
    const decision = await sentinel.decide(activity);
    expect(decision).toEqual([SentinelDecision.Allowed, mockedTime]);
  });

  it('should return blocked if the activity is not blocked and there are 7 failed attempts', async () => {
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce(null);
    (sentinel as any).sentinelActivities.countFailedAttempts.mockResolvedValueOnce(7);

    const activity = createMockActivityReport();
    const decision = await sentinel.decide(activity);
    expect(decision).toEqual([SentinelDecision.Blocked, mockedCustomBlockedTime]);
  });

  it('should return blocked if the activity is not blocked and there are 4 failed attempts and the current activity is failed', async () => {
    (sentinel as any).sentinelActivities.findBlocked.mockResolvedValueOnce(null);
    (sentinel as any).sentinelActivities.countFailedAttempts.mockResolvedValueOnce(6);

    const activity = createMockActivityReport();
    // eslint-disable-next-line @silverhand/fp/no-mutation
    activity.actionResult = SentinelActionResult.Failed;
    const decision = await sentinel.decide(activity);
    expect(decision).toEqual([SentinelDecision.Blocked, mockedCustomBlockedTime]);
  });
});
