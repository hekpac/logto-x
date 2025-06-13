import { assert } from '@silverhand/essentials';
import { MongoClient } from 'mongodb';
import { ConfigKey, consoleLog, getCliConfigWithPrompt } from './utils.js';

export const defaultMongodbUri = 'mongodb://localhost:27017/logto';

export const getMongodbUriFromConfig = async () =>
  (await getCliConfigWithPrompt({
    key: ConfigKey.MongodbUri,
    readableKey: 'Logto MongoDB URI',
    defaultValue: defaultMongodbUri,
  })) ?? '';

export const createClientFromConfig = async () => {
  const mongodbUri = await getMongodbUriFromConfig();
  assert(mongodbUri, new Error('Database URL is required in URL'));
  const client = new MongoClient(mongodbUri);
  await client.connect();
  return client;
};

export const createClientAndDatabaseIfNeeded = async () => {
  try {
    return await createClientFromConfig();
  } catch (error: unknown) {
    consoleLog.fatal(error);
    throw error;
  }
};
