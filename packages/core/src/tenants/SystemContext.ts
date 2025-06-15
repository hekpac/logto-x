import {
  CloudflareKey,
  type HostnameProviderData,
  type StorageProviderData,
  hostnameProviderDataGuard,
  storageProviderDataGuard,
  StorageProviderKey,
  type SystemKey,
  type ProtectedAppConfigProviderData,
  protectedAppConfigProviderDataGuard,
} from '@logto/schemas';
import type { MongoClient } from 'mongodb';
import { type ZodType } from 'zod';

import { createSystemsQuery } from '#src/queries/system.js';
import { devConsole } from '#src/utils/console.js';

export default class SystemContext {
  static shared = new SystemContext();
  public storageProviderConfig?: StorageProviderData;
  public experienceBlobsProviderConfig?: StorageProviderData;
  public experienceZipsProviderConfig?: StorageProviderData;
  public hostnameProviderConfig?: HostnameProviderData;
  public protectedAppConfigProviderConfig?: ProtectedAppConfigProviderData;
  public protectedAppHostnameProviderConfig?: HostnameProviderData;

  async loadProviderConfigs(pool: MongoClient) {
    await Promise.all([
      (async () => {
        this.storageProviderConfig = await this.loadConfig(
          pool,
          StorageProviderKey.StorageProvider,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          storageProviderDataGuard
        );
      })(),
      (async () => {
        this.experienceBlobsProviderConfig = await this.loadConfig(
          pool,
          StorageProviderKey.ExperienceBlobsProvider,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          storageProviderDataGuard
        );
      })(),
      (async () => {
        this.experienceZipsProviderConfig = await this.loadConfig(
          pool,
          StorageProviderKey.ExperienceZipsProvider,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          storageProviderDataGuard
        );
      })(),
      (async () => {
        this.hostnameProviderConfig = await this.loadConfig(
          pool,
          CloudflareKey.HostnameProvider,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          hostnameProviderDataGuard
        );
      })(),
      (async () => {
        this.protectedAppConfigProviderConfig = await this.loadConfig(
          pool,
          CloudflareKey.ProtectedAppConfigProvider,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          protectedAppConfigProviderDataGuard
        );
      })(),
      (async () => {
        this.protectedAppHostnameProviderConfig = await this.loadConfig(
          pool,
          CloudflareKey.ProtectedAppHostnameProvider,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          hostnameProviderDataGuard
        );
      })(),
    ]);
  }

  private async loadConfig<T>(
    pool: MongoClient,
    key: SystemKey,
    guard: ZodType<T>
  ): Promise<T | undefined> {
    const { findSystemByKey } = createSystemsQuery(pool);
    const record = await findSystemByKey(key);

    if (!record) {
      return;
    }

    const result = guard.safeParse(record.value as unknown);

    if (!result.success) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument
      devConsole.error(`Failed to parse ${key} config:`, result.error);

      return;
    }

    return result.data;
  }
}
