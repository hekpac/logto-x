import { Client } from '@opensearch-project/opensearch';

import { EnvSet } from '../env-set/index.js';

/**
 * Initialize an OpenSearch client with the configured URL.
 * Returns `undefined` if `OPENSEARCH_URL` is not provided.
 */
export const createOpenSearchClient = () => {
  const { opensearchUrl } = EnvSet.values;
  return opensearchUrl ? new Client({ node: opensearchUrl }) : undefined;
};

export const openSearchClient = createOpenSearchClient();
