import { describe, expect, it } from 'vitest';
import { ask } from './harness.js';

const PROMPT = 'Search this LinkedIn profile: linkedin.com/in/jane-doe-42';

const providers: Array<{ provider: 'claude' | 'openai'; envKey: string }> = [
  { provider: 'claude', envKey: 'ANTHROPIC_API_KEY' },
  { provider: 'openai', envKey: 'OPENAI_API_KEY' },
];

describe('eval: linkedin search', () => {
  for (const p of providers) {
    it.skipIf(!process.env[p.envKey])(`${p.provider} selects person_search with linkedin`, async () => {
      const call = await ask({ provider: p.provider, prompt: PROMPT });
      expect(call?.name).toBe('person_search');
      expect((call?.input as { linkedin?: string }).linkedin).toMatch(/jane-doe-42/);
    });
  }
});
