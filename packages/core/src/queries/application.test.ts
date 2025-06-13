import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApplicationQueries } from './application.js';
import { ApplicationModel } from '#src/models/application.js';

const { findApplicationById, insertApplication } = createApplicationQueries(
  mongoose.connection.getClient()
);

describe('application queries with MongoDB', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it('insert and find application', async () => {
    await insertApplication({
      tenantId: 't1',
      id: 'a1',
      name: 'app',
      secret: 's',
      description: 'd',
      type: 'SPA',
      oidcClientMetadata: {},
      customClientMetadata: {},
      customData: {},
    });

    const app = await findApplicationById('a1');
    expect(app?.name).toBe('app');
  });
});
