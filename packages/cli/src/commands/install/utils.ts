import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { assert } from '@silverhand/essentials';
import chalk from 'chalk';
import { got, RequestError } from 'got';
import inquirer from 'inquirer';
import * as semver from 'semver';
import { extract } from 'tar';

import { defaultPath } from '../../constants.js';
import { createPoolAndDatabaseIfNeeded } from '../../database.js';
import { packageJson } from '../../package-json.js';
import {
  cliConfig,
  ConfigKey,
  consoleLog,
  downloadFile,
  isTty,
  oraPromise,
  safeExecSync,
} from '../../utils.js';
import { seedByPool } from '../database/seed/index.js';


export const validateNodeVersion = () => {
  const requiredVersionString = packageJson.engines.node;
  const requiredRange = new semver.Range(requiredVersionString);
  const required = requiredVersionString
    .split('||')
    .map((version) => new semver.SemVer(version.trim().replace(/^\^/, '')));
  const current = new semver.SemVer(execSync('node -v', { encoding: 'utf8', stdio: 'pipe' }));

  // Exit if the major version is lower than the required version since there may be changes that
  // break the compatibility.
  if (required.every((version) => version.major > current.major)) {
    consoleLog.fatal(
      `Logto requires NodeJS ${requiredVersionString}, but ${current.version} found.`
    );
  }

  // Only warn for incompatible minor/patch versions or higher major versions.
  if (!requiredRange.test(current.version)) {
    consoleLog.warn(
      `Logto is tested under NodeJS ${requiredVersionString}, but version ${current.version} found.`
    );
  }
};

const validatePath = (value: string) =>
  existsSync(path.resolve(value))
    ? `The path ${chalk.green(value)} already exists, please try another.`
    : true;

export const inquireInstallPath = async (initialPath?: string) => {
  if (!isTty()) {
    assert(initialPath, new Error('Path is missing'));

    return initialPath;
  }

  const { instancePath } = await inquirer.prompt<{ instancePath: string }>(
    {
      name: 'instancePath',
      message: 'Where should we create your Logto instance?',
      type: 'input',
      default: defaultPath,
      filter: (value: string) => value.trim(),
      validate: validatePath,
    },
    { instancePath: initialPath }
  );

  // Validate for initialPath
  const validated = validatePath(instancePath);

  if (validated !== true) {
    consoleLog.fatal(validated);
  }

  return instancePath;
};

export const validateDatabase = async () => {
  if (cliConfig.has(ConfigKey.MongodbUri) || !isTty()) {
    return;
  }

  const { hasMongoUrl } = await inquirer.prompt<{ hasMongoUrl?: boolean }>({
    name: 'hasMongoUrl',
    message:
      'Logto requires a MongoDB replicaset but no configuration was found.\n  Do you have a remote MongoDB instance ready?',
    type: 'confirm',
  });

  if (hasMongoUrl === false) {
    consoleLog.fatal('Logto requires a MongoDB replicaset to run.');
  }
};

const fetchDownloadUrl = async (url?: string) => {
  if (url) {
    return url;
  }

  const defaultUrl = `https://github.com/logto-io/logto/releases/download/v${packageJson.version}/logto.tar.gz`;

  try {
    await got.head(defaultUrl);
  } catch (error) {
    if (error instanceof RequestError && error.response?.statusCode === 404) {
      consoleLog.warn(
        `Current version "v${packageJson.version}" not found in GitHub Releases, fallback to "latest".\n` +
          'If you want to download the latest version, please wait a few moments and try again.'
      );
      return 'https://github.com/logto-io/logto/releases/latest/download/logto.tar.gz';
    }
  }

  return defaultUrl;
};

export const downloadRelease = async (url?: string) => {
  const tarFilePath = path.resolve(os.tmpdir(), './logto.tar.gz');
  const from = await fetchDownloadUrl(url);

  consoleLog.info(`Download Logto from ${from}`);
  consoleLog.info(`Target ${tarFilePath}`);
  await downloadFile(from, tarFilePath);

  return tarFilePath;
};

export const decompress = async (toPath: string, tarPath: string) => {
  const run = async () => {
    try {
      await fs.mkdir(toPath);
      await extract({ file: tarPath, cwd: toPath, strip: 1 });
    } catch (error: unknown) {
      consoleLog.fatal(error);
    }
  };

  return oraPromise(
    run(),
    {
      text: `Decompress to ${toPath}`,
    },
    true
  );
};

export const seedDatabase = async (instancePath: string, cloud: boolean) => {
  try {
    const pool = await createPoolAndDatabaseIfNeeded();
    await seedByPool(pool, cloud);
    await pool.end();
  } catch (error: unknown) {
    consoleLog.error(error);

    await oraPromise(fs.rm(instancePath, { force: true, recursive: true }), {
      text: 'Clean up',
    });

    consoleLog.fatal(
      'Error occurred during seeding your Logto database. Nothing has changed since the seeding process was in a transaction.\n\n' +
        `  To skip the database seeding, append ${chalk.green(
          '--skip-seed'
        )} to the command options.`
    );
  }
};

export const createEnv = async (installPath: string, mongodbUri: string) => {
  const dotEnvPath = path.resolve(installPath, '.env');
  await fs.writeFile(dotEnvPath, `MONGODB_URI=${mongodbUri}`, 'utf8');
  consoleLog.info(`Saved MongoDB URI to ${chalk.blue(dotEnvPath)}`);
};

export const logFinale = (installPath: string) => {
  const startCommand = `cd ${installPath} && npm start`;
  consoleLog.info(
    `Use the command below to start Logto. Happy hacking!\n\n  ${chalk.green(startCommand)}`
  );
};

export const isUrl = (string: string) => {
  try {
    // On purpose to test
    // eslint-disable-next-line no-new
    new URL(string);

    return true;
  } catch {
    return false;
  }
};
