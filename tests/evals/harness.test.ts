import { describe, expect, it } from 'vitest';

describe('harness smoke', () => {
  it('loads without error', async () => {
    const mod = await import('./harness.js');
    expect(typeof mod.ask).toBe('function');
    expect(typeof mod.askClaude).toBe('function');
    expect(typeof mod.askOpenAI).toBe('function');
  });
});
