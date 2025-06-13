import { MongoClient } from 'mongodb';
import { assert } from '@silverhand/essentials';

const createConnectionByEnv = async (
  databaseUrl: string,
  mockDatabaseConnection: boolean
) => {
  if (mockDatabaseConnection) {
    return new MongoClient('');
  }

  assert(databaseUrl, new Error('Database URL is required'));
  const client = new MongoClient(databaseUrl);
  await client.connect();
  return client;
};

export default createConnectionByEnv;
