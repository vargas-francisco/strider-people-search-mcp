import { describe, expect, it, vi } from 'vitest';
import { personSearch } from '../../src/tools/personSearch.js';
import type { Runtime } from '../../src/runtime.js';
import type { Config } from '../../src/config.js';
import { createLogger } from '../../src/logger.js';

const config: Config = {
  baseUrl: 'https://example.com',
  httpPort: 3000,
  pollTimeoutMs: 200,
  pollIntervalMs: 5,
  logLevel: 'silent',
};

const fakeRuntime = (clientOverrides: Partial<Runtime['client']>): Runtime => ({
  config,
  logger: createLogger({ logLevel: 'silent' }),
  client: {
    startPersonSearch: vi.fn(),
    getPersonSearchJob: vi.fn(),
    getResumeStatus: vi.fn(),
    getResumeResults: vi.fn(),
    ...clientOverrides,
  } as Runtime['client'],
});

describe('personSearch tool', () => {
  it('returns ok with results when job processes within timeout', async () => {
    const runtime = fakeRuntime({
      startPersonSearch: vi.fn().mockResolvedValue({ sentry_job_id: 's1' }),
      getPersonSearchJob: vi
        .fn()
        .mockResolvedValueOnce({ status: 'processing', job_id: 's1' })
        .mockResolvedValueOnce({ status: 'processed', job_id: 's1', results: [{ name: 'John' }] }),
    });
    const result = await personSearch({ emails: ['j@example.com'] }, runtime);
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect((result.data as { results: unknown[] }).results).toHaveLength(1);
    }
  });

  it('returns running envelope when poll times out', async () => {
    const runtime = fakeRuntime({
      startPersonSearch: vi.fn().mockResolvedValue({ sentry_job_id: 's2' }),
      getPersonSearchJob: vi.fn().mockResolvedValue({ status: 'processing', job_id: 's2' }),
    });
    const result = await personSearch({ emails: ['j@example.com'] }, runtime);
    expect(result.status).toBe('running');
    if (result.status === 'running') {
      expect(result.job_id).toBe('s2');
      expect(result.retry_with).toBe('person_search_get_result');
    }
  });

  it('returns invalid_input when identification minimum is not met', async () => {
    const runtime = fakeRuntime({});
    const result = await personSearch({ first_names: ['John'] }, runtime);
    expect('error' in result && result.error).toBe('invalid_input');
  });

  it('passes resume_check_job_id through when included', async () => {
    const runtime = fakeRuntime({
      startPersonSearch: vi
        .fn()
        .mockResolvedValue({ sentry_job_id: 's3', resume_check_job_id: 'r3' }),
      getPersonSearchJob: vi
        .fn()
        .mockResolvedValue({ status: 'processed', job_id: 's3', results: [] }),
    });
    const result = await personSearch(
      {
        emails: ['j@example.com'],
        include_resume_check: true,
        resume_file: { fileName: 'cv.pdf', fileExtension: 'pdf', fileBase64: 'aGVsbG8=' },
      },
      runtime,
    );
    expect(result.status === 'ok' && result.resume_check_job_id).toBe('r3');
  });
});
