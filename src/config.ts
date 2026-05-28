export interface Config {
  baseUrl: string;
  httpPort: number;
  pollTimeoutMs: number;
  pollIntervalMs: number;
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  auth0Token?: string;
  auth0TokenUrl?: string;
  auth0Audience?: string;
  auth0ClientId?: string;
  auth0ClientSecret?: string;
}

const intEnv = (name: string, fallback: number): number => {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) throw new Error(`${name} must be an integer, got "${v}"`);
  return n;
};

const strEnv = (name: string, fallback: string): string => {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
};

export const loadConfig = (): Config => ({
  baseUrl: strEnv('STRIDER_BASE_URL', 'https://app.striderintel.com'),
  httpPort: intEnv('MCP_HTTP_PORT', 3000),
  pollTimeoutMs: intEnv('MCP_POLL_TIMEOUT_MS', 90_000),
  pollIntervalMs: intEnv('MCP_POLL_INTERVAL_MS', 1_500),
  logLevel: strEnv('LOG_LEVEL', 'info') as Config['logLevel'],
  auth0Token: process.env.STRIDER_AUTH0_TOKEN,
  auth0TokenUrl: process.env.STRIDER_AUTH0_TOKEN_URL,
  auth0Audience: process.env.STRIDER_AUTH0_AUDIENCE,
  auth0ClientId: process.env.STRIDER_AUTH0_CLIENT_ID,
  auth0ClientSecret: process.env.STRIDER_AUTH0_CLIENT_SECRET,
});
