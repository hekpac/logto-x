import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  isIntegrationTest,
  getPwnPasswordsForTest,
  getDisposableEmailDomainsForTest,
} from './test-env-utils.js';

const ORIGINAL_ENV = process.env;

describe('test-env-utils', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('isIntegrationTest reflects env variable', () => {
    Reflect.deleteProperty(process.env, 'INTEGRATION_TEST');
    expect(isIntegrationTest()).toBe(false);

    process.env.INTEGRATION_TEST = 'true';
    expect(isIntegrationTest()).toBe(true);
  });

  it('getPwnPasswordsForTest works under integration test', () => {
    process.env.INTEGRATION_TEST = '1';
    expect(getPwnPasswordsForTest()).toEqual(['123456aA', 'test_password']);
  });

  it('getPwnPasswordsForTest throws when not integration test', () => {
    Reflect.deleteProperty(process.env, 'INTEGRATION_TEST');
    expect(() => getPwnPasswordsForTest()).toThrow();
  });

  it('getDisposableEmailDomainsForTest works under integration test', () => {
    process.env.INTEGRATION_TEST = '1';
    expect(getDisposableEmailDomainsForTest()).toEqual(['disposable.test']);
  });

  it('getDisposableEmailDomainsForTest throws when not integration test', () => {
    Reflect.deleteProperty(process.env, 'INTEGRATION_TEST');
    expect(() => getDisposableEmailDomainsForTest()).toThrow();
  });
});
