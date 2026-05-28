import { Config } from './config.js';
import { createLogger } from './logger.js';
import { createStriderClient, StriderClient } from './client/striderClient.js';
import { Logger } from 'pino';

export interface Runtime {
  client: StriderClient;
  config: Config;
  logger: Logger;
}

export interface CreateRuntimeOptions {
  token: string;
  config: Config;
}

export const createRuntime = (opts: CreateRuntimeOptions): Runtime => ({
  client: createStriderClient({ baseUrl: opts.config.baseUrl, token: opts.token }),
  config: opts.config,
  logger: createLogger({ logLevel: opts.config.logLevel }),
});
