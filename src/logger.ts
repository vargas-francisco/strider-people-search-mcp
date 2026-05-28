import pino, { Logger } from 'pino';

export interface LoggerOptions {
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';
}

export const createLogger = (opts: LoggerOptions): Logger =>
  pino({
    level: opts.logLevel,
    base: { service: 'strider-people-search-mcp' },
    redact: ['req.headers.authorization', 'headers.authorization', 'token', 'auth0Token'],
    timestamp: pino.stdTimeFunctions.isoTime,
  });
