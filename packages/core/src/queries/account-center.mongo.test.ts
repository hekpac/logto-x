import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { type AccountCenter } from '@logto/schemas';

import { WellKnownCache } from '../caches/well-known.js';
import { AccountCenterMongoQueries } from './account-center.mongo.js';

const DEFAULT_ID = 'default';

describe('AccountCenterMongoQueries', () => {
  let server: MongoMemoryServer;

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    await mongoose.connect(server.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await server.stop();
  });

  it('should insert and fetch the default account center', async () => {
    const cache = new WellKnownCache('t1', new Map());
    const queries = new AccountCenterMongoQueries(cache);
    await queries.insert({ id: DEFAULT_ID } as AccountCenter);

    const result = await queries.findDefaultAccountCenter();
    expect(result?.id).toBe(DEFAULT_ID);
  });
});
