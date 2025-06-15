import { MongoServerError } from 'mongodb';

import RequestError from '#src/errors/RequestError/index.js';

export const errorHandler = (error: unknown) => {
  if (error instanceof MongoServerError && error.code === 11000) {
    throw new RequestError({ code: 'entity.unique_integrity_violation', status: 422 });
  }

  throw error;
};
