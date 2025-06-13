import type { Application, CreateApplication } from '@logto/schemas';
import { ApplicationModel } from '#src/models/application.js';
import type { FilterQuery } from 'mongoose';
import { openSearchClient } from '../search/opensearch.js';
import type { MongoClient } from 'mongodb';
import RequestError from '#src/errors/RequestError/index.js';

export const createApplicationQueries = (_client: MongoClient) => {
  const findApplicationById = async (id: string) =>
    ApplicationModel.findOne({ id }).lean<Application>().exec();

  const insertApplication = async (payload: CreateApplication) => {
    const doc = await ApplicationModel.create(payload);
    if (openSearchClient) {
      await openSearchClient.index({
        index: 'applications',
        id: doc.id,
        document: doc.toJSON(),
      });
    }
    return doc.toJSON() as Application;
  };

  const updateApplicationById = async (
    id: string,
    set: Partial<CreateApplication>
  ) => {
    const doc = await ApplicationModel.findOneAndUpdate({ id }, set, {
      new: true,
    }).lean<Application>();
    if (doc && openSearchClient) {
      await openSearchClient.index({
        index: 'applications',
        id: doc.id,
        document: doc,
      });
    }
    return doc;
  };

    const deleteApplicationById = async (id: string) => {
      const res = await ApplicationModel.deleteOne({ id });
      if (openSearchClient) {
        await openSearchClient.delete({ index: 'applications', id });
      }
      if (res.deletedCount === 0) {
        throw new RequestError({
          code: 'entity.not_exists_with_id',
          name: 'applications',
          id,
          status: 404,
        });
      }
    };

  const findApplications = (filter: FilterQuery<typeof ApplicationModel>) =>
    ApplicationModel.find(filter).lean<Application>().exec();

  return {
    findApplicationById,
    insertApplication,
    updateApplicationById,
    deleteApplicationById,
    findApplications,
  };
};
