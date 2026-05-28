import { describe, expect, it } from 'vitest';
import { ask } from './harness.js';

const PROMPT = 'Search for the person with email jsmith@example.com.';

const providers: Array<{ provider: 'claude' | 'openai'; envKey: string }> = [
  { provider: 'claude', envKey: 'ANTHROPIC_API_KEY' },
  { provider: 'openai', envKey: 'OPENAI_API_KEY' },
];

describe('eval: email search', () => {
  for (const p of providers) {
    it.skipIf(!process.env[p.envKey])(`${p.provider} selects person_search with emails`, async () => {
      const call = await ask({ provider: p.provider, prompt: PROMPT });
      expect(call?.name).toBe('person_search');
      expect((call?.input as { emails?: string[] }).emails).toEqual(['jsmith@example.com']);
    });
  }
});
