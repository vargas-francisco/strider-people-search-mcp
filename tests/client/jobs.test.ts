import { describe, expect, it, vi } from 'vitest';
import { pollJob } from '../../src/client/jobs.js';

describe('pollJob', () => {
  it('returns done when the fetch returns a processed status before timeout', async () => {
    const startedJobId = 'jid-1';
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({ status: 'processing' })
      .mockResolvedValueOnce({ status: 'processed', results: [{ a: 1 }] });

    const result = await pollJob({
      jobId: startedJobId,
      fetch: fetchFn,
      isDone: (r) => r.status === 'processed',
      isFailed: (r) => r.status === 'failed',
      timeoutMs: 5_000,
      intervalMs: 5,
    });
    expect(result.status).toBe('done');
    if (result.status === 'done') {
      expect(result.value).toEqual({ status: 'processed', results: [{ a: 1 }] });
    }
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('returns timeout when not done within timeoutMs', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ status: 'processing' });
    const result = await pollJob({
      jobId: 'jid-2',
      fetch: fetchFn,
      isDone: (r) => r.status === 'processed',
      isFailed: () => false,
      timeoutMs: 30,
      intervalMs: 5,
    });
    expect(result.status).toBe('timeout');
  });

  it('returns failed when isFailed matches', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce({ status: 'failed', message: 'nope' });
    const result = await pollJob({
      jobId: 'jid-3',
      fetch: fetchFn,
      isDone: (r) => r.status === 'processed',
      isFailed: (r) => r.status === 'failed',
      timeoutMs: 1_000,
      intervalMs: 5,
    });
    expect(result.status).toBe('failed');
  });
});
