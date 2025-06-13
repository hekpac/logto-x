import { describe, expect, it } from 'vitest';

import { generateRandomString } from './random-string.js';

describe('generateRandomString', () => {
  it('should generate string with specified length', () => {
    expect(generateRandomString(10).length).toBe(10);
  });

  it('should generate string containing uppercase letter', () => {
    while (!/[A-Z]/.test(generateRandomString(32))) {
      // Keep generating until an uppercase letter appears
    }
  });
});

