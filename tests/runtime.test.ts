import { describe, expect, it } from 'vitest';
import { createRuntime } from '../src/runtime.js';

describe('createRuntime', () => {
  it('wires together a client given a token', () => {
    const runtime = createRuntime({
      token: 'tk',
      config: {
        baseUrl: 'https://example.com',
        httpPort: 3000,
        pollTimeoutMs: 1000,
        pollIntervalMs: 100,
        logLevel: 'silent',
      },
    });
    expect(typeof runtime.client.startPersonSearch).toBe('function');
    expect(typeof runtime.logger.info).toBe('function');
    expect(runtime.config.pollTimeoutMs).toBe(1000);
  });
});
