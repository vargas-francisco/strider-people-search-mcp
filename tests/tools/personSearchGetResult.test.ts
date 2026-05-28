import { describe, expect, it, vi } from 'vitest';
import { personSearchGetResult } from '../../src/tools/personSearchGetResult.js';
import type { Runtime } from '../../src/runtime.js';
import type { Config } from '../../src/config.js';
import { createLogger } from '../../src/logger.js';

const config: Config = {
  baseUrl: 'https://example.com',
  httpPort: 3000,
  pollTimeoutMs: 1000,
  pollIntervalMs: 5,
  logLevel: 'silent',
};

const runtime = (impl: Partial<Runtime['client']>): Runtime => ({
  config,
  logger: createLogger({ logLevel: 'silent' }),
  client: {
    startPersonSearch: vi.fn(),
    getPersonSearchJob: vi.fn(),
    getResumeStatus: vi.fn(),
    getResumeResults: vi.fn(),
    ...impl,
  } as Runtime['client'],
});

describe('personSearchGetResult', () => {
  it('returns invalid_input when job_id is malformed', async () => {
    const r = await personSearchGetResult({ job_id: '../bad' }, runtime({}));
    expect('error' in r && r.error).toBe('invalid_input');
  });

  it('returns ok with results when status=processed', async () => {
    const r = await personSearchGetResult(
      { job_id: 'abc' },
      runtime({
        getPersonSearchJob: vi
          .fn()
          .mockResolvedValue({ status: 'processed', job_id: 'abc', results: [{ x: 1 }] }),
      }),
    );
    expect(r.status).toBe('ok');
  });

  it('returns running when status=processing', async () => {
    const r = await personSearchGetResult(
      { job_id: 'abc' },
      runtime({
        getPersonSearchJob: vi.fn().mockResolvedValue({ status: 'processing', job_id: 'abc' }),
      }),
    );
    expect(r.status).toBe('running');
  });
});
