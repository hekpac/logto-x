import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const createMongoConnectionByEnv = async (
  mongoUri: string,
  mockDatabaseConnection: boolean
) => {
  const uri = mockDatabaseConnection
    ? (await MongoMemoryServer.create()).getUri()
    : mongoUri;

  await mongoose.connect(uri);
  return mongoose.connection;
};

export default createMongoConnectionByEnv;
