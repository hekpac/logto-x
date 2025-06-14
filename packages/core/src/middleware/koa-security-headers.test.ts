/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import { GlobalValues } from '@logto/shared';
import { createMockUtils, pickDefault } from '@logto/shared/esm';

import createMockContext from '#src/test-utils/jest-koa-mocks/create-mock-context.js';

const { jest } = import.meta;
const { mockEsmWithActual } = createMockUtils(jest);

await mockEsmWithActual('#src/env-set/index.js', () => ({
  EnvSet: {
    get values() {
      return new GlobalValues();
    },
  },
}));

const koaSecurityHeaders = await pickDefault(import('./koa-security-headers.js'));

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = async () => {};

it('should set the COEP header by default', async () => {
  const ctx = createMockContext({ url: '/' });
  const run = koaSecurityHeaders([], 'default');

  await run(ctx, noop);

  expect(ctx.response.headers['cross-origin-embedder-policy']).toBe('require-corp');
});

/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
