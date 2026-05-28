import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _clearTokenCache, resolveToken } from '../../src/client/auth.js';

describe('resolveToken', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _clearTokenCache();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns the explicit token when provided', async () => {
    const token = await resolveToken({ explicitToken: 'abc-123' });
    expect(token).toBe('abc-123');
  });

  it('mints a token via client_credentials when no explicit token', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ access_token: 'minted-1', expires_in: 3600 }),
    })) as unknown as typeof fetch;
    const token = await resolveToken({
      clientId: 'id',
      clientSecret: 'secret',
      audience: 'aud',
      tokenUrl: 'https://example.com/oauth/token',
      fetchImpl: fetchMock,
    });
    expect(token).toBe('minted-1');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('caches minted tokens for their lifetime', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ access_token: 'minted-cached', expires_in: 3600 }),
    })) as unknown as typeof fetch;
    const opts = {
      clientId: 'id',
      clientSecret: 'secret',
      audience: 'aud',
      tokenUrl: 'https://example.com/oauth/token',
      fetchImpl: fetchMock,
    };
    await resolveToken(opts);
    await resolveToken(opts);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('throws when no credentials are configured', async () => {
    await expect(resolveToken({})).rejects.toThrow(/no Strider credentials/);
  });
});
