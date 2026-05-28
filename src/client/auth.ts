export interface ResolveTokenOptions {
  explicitToken?: string;
  clientId?: string;
  clientSecret?: string;
  audience?: string;
  tokenUrl?: string;
  fetchImpl?: typeof fetch;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

const cache = new Map<string, CachedToken>();

const cacheKey = (opts: ResolveTokenOptions): string =>
  [opts.tokenUrl, opts.clientId, opts.audience].join('|');

export const resolveToken = async (opts: ResolveTokenOptions): Promise<string> => {
  if (opts.explicitToken) return opts.explicitToken;
  if (!opts.clientId || !opts.clientSecret || !opts.audience || !opts.tokenUrl) {
    throw new Error(
      'no Strider credentials available: provide STRIDER_AUTH0_TOKEN or all of STRIDER_AUTH0_CLIENT_ID/SECRET/AUDIENCE/TOKEN_URL',
    );
  }
  const key = cacheKey(opts);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const fetchImpl = opts.fetchImpl ?? fetch;
  const res = await fetchImpl(opts.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      audience: opts.audience,
    }),
  });
  if (!res.ok) {
    throw new Error(`failed to mint Auth0 token: HTTP ${res.status}`);
  }
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cache.set(key, {
    token: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  });
  return body.access_token;
};

export const _clearTokenCache = (): void => {
  cache.clear();
};
