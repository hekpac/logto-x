import { createPool } from '@silverhand/slonik';
import { MongoClient } from 'mongodb';
import { ApplicationModel } from '../models/application.js';
import { UserModel } from '../models/user.js';

/**
 * Simple migration script from PostgreSQL to MongoDB.
 * It assumes environment variables POSTGRES_URL and MONGODB_URL are set.
 */
export const migrate = async () => {
  const pgPool = await createPool(process.env.POSTGRES_URL!, {
    interceptors: [],
  });
  const mongo = new MongoClient(process.env.MONGODB_URL!);
  await mongo.connect();

  const applications = await pgPool.any('select * from applications');
  await ApplicationModel.insertMany(applications);

  const users = await pgPool.any('select * from users');
  await UserModel.insertMany(users);

  await mongo.close();
  await pgPool.end();
};

if (require.main === module) {
  migrate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
