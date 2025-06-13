import { ConsoleLog, GlobalValues } from '@logto/shared';
import type { Optional } from '@silverhand/essentials';
import { appendPath } from '@silverhand/essentials';
import type { MongoClient } from 'mongodb';
import chalk from 'chalk';

import { createLogtoConfigLibrary } from '#src/libraries/logto-config.js';
import { createLogtoConfigQueries } from '#src/queries/logto-config.js';

import createConnectionByEnv from './mongo-connection.js';
import loadOidcValues from './oidc.js';
import { throwNotLoadedError } from './throw-errors.js';
import { getTenantEndpoint } from './utils.js';

/** Apps (also paths) for user tenants. */
export enum UserApps {
  Api = 'api',
  Oidc = 'oidc',
  DemoApp = 'demo-app',
  WellKnown = '.well-known',
}

/** Apps (also paths) ONLY for the admin tenant. */
export enum AdminApps {
  Me = 'me',
  Console = 'console',
  Welcome = 'welcome',
}

export class EnvSet {
  /** The value set for global configurations.  */
  static values = new GlobalValues();

  static get dbUrl() {
    return this.values.dbUrl;
  }

  static sharedClient = createConnectionByEnv(
    this.dbUrl,
    EnvSet.values.isUnitTest
  );
  #client: Optional<MongoClient>;
  #oidc: Optional<Awaited<ReturnType<typeof loadOidcValues>>>;
  #endpoint: Optional<URL>;

  constructor(
    public readonly tenantId: string,
    public readonly mongodbUri: string
  ) {}

  get client() {
    if (!this.#client) {
      return throwNotLoadedError();
    }

    return this.#client;
  }

  get oidc() {
    if (!this.#oidc) {
      return throwNotLoadedError();
    }

    return this.#oidc;
  }

  get endpoint() {
    if (!this.#endpoint) {
      return throwNotLoadedError();
    }

    return this.#endpoint;
  }

  async load(customDomain?: string) {
    const client = await createConnectionByEnv(
      this.mongodbUri,
      EnvSet.values.isUnitTest
    );

    this.#client = client;

    const consoleLog = new ConsoleLog(chalk.magenta('env-set'));
    const { getOidcConfigs } = createLogtoConfigLibrary({
      logtoConfigs: createLogtoConfigQueries(client),
    });

    const oidcConfigs = await getOidcConfigs(consoleLog);
    this.#endpoint = customDomain
      ? new URL(customDomain)
      : getTenantEndpoint(this.tenantId, EnvSet.values);
    this.#oidc = await loadOidcValues(appendPath(this.#endpoint, '/oidc').href, oidcConfigs);
  }

  async end() {
    await this.#client?.close();
  }
}

export { getTenantEndpoint } from './utils.js';
