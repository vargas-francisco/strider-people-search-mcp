import { describe, expect, it, vi } from 'vitest';
import { resumeCheckGetStatus } from '../../src/tools/resumeCheckGetStatus.js';
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

describe('resumeCheckGetStatus', () => {
  it('returns ok with the status payload', async () => {
    const r = await resumeCheckGetStatus(
      { resume_check_job_id: 'r1' },
      runtime({
        getResumeStatus: vi
          .fn()
          .mockResolvedValue({ status: 'processing', message: 'in progress' }),
      }),
    );
    expect(r.status).toBe('ok');
  });

  it('returns invalid_input for malformed id', async () => {
    const r = await resumeCheckGetStatus({ resume_check_job_id: '$$$' }, runtime({}));
    expect('error' in r && r.error).toBe('invalid_input');
  });
});
