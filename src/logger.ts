import pino, { Logger } from 'pino';

export interface LoggerOptions {
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';
}

export const createLogger = (opts: LoggerOptions): Logger =>
  pino({
    level: opts.logLevel,
    base: { service: 'strider-people-search-mcp' },
    redact: [
      // pino redact paths are case-sensitive; cover all variants we might log
      'req.headers.authorization',
      'req.headers.Authorization',
      'headers.authorization',
      'headers.Authorization',
      // Axios errors carry the request config including the Authorization header
      'err.config.headers.Authorization',
      'err.config.headers.authorization',
      'err.request._header',
      // Generic
      'token',
      'auth0Token',
      '*.Authorization',
      '*.authorization',
    ],
    timestamp: pino.stdTimeFunctions.isoTime,
  });
