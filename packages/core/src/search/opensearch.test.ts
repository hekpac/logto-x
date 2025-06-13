import { createMockUtils } from '@logto/shared/esm';
import Sinon from 'sinon';

import { EnvSet } from '#src/env-set/index.js';

const { jest } = import.meta;
const { mockEsm } = createMockUtils(jest);

const mockClient = jest.fn();

mockEsm('@opensearch-project/opensearch', () => ({
  Client: jest.fn().mockImplementation(() => ({ search: mockClient })),
}));

const { createOpenSearchClient } = await import('./opensearch.js');

describe('createOpenSearchClient', () => {
  it('should return undefined if no OPENSEARCH_URL', () => {
    const stub = Sinon.stub(EnvSet, 'values').value({
      ...EnvSet.values,
      opensearchUrl: undefined,
    });

    expect(createOpenSearchClient()).toBeUndefined();
    stub.restore();
  });

  it('should create a client when OPENSEARCH_URL is provided', () => {
    const stub = Sinon.stub(EnvSet, 'values').value({
      ...EnvSet.values,
      opensearchUrl: 'http://localhost:9200',
    });

    expect(createOpenSearchClient()).toBeTruthy();
    stub.restore();
  });
});
