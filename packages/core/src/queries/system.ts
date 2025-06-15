import type { SystemKey } from '@logto/schemas';
import type { MongoClient } from 'mongodb';

import { SystemModel } from '../models/system.js';

const findSystemByKey = async (key: SystemKey) =>
  SystemModel.findOne({ key }).lean<Record<string, unknown>>().exec();

export const createSystemsQuery = (_client: MongoClient) => ({
  findSystemByKey,
});
