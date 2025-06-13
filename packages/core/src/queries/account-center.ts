import type { AccountCenter } from '@logto/schemas';
import mongoose from 'mongoose';

import type { WellKnownCache } from '../caches/well-known.js';
import MongoSchemaQueries from '../database/mongo-schema-queries.js';

const AccountCenterSchema = new mongoose.Schema<AccountCenter>({
  id: { type: String, required: true, unique: true },
  displayName: String,
  logoUri: String,
  primaryColor: String,
});

const AccountCenterModel = mongoose.models.AccountCenter ||
  mongoose.model<AccountCenter>('AccountCenter', AccountCenterSchema);

const DEFAULT_ID = 'default';

export class AccountCenterQueries extends MongoSchemaQueries<AccountCenter> {
  public readonly findDefaultAccountCenter = this.wellKnownCache.memoize(
    async () => this.findById(DEFAULT_ID),
    ['account-center']
  );

  public readonly updateDefaultAccountCenter = this.wellKnownCache.mutate(
    async (accountCenter: Partial<AccountCenter>) =>
      this.updateById(DEFAULT_ID, accountCenter),
    ['account-center']
  );

  constructor(public readonly wellKnownCache: WellKnownCache) {
    super(AccountCenterModel);
  }
}

export const createAccountCenterQueries = (wellKnownCache: WellKnownCache) =>
  new AccountCenterQueries(wellKnownCache);
