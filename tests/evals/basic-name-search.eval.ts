import { describe, expect, it } from 'vitest';
import { ask } from './harness.js';

const PROMPT = 'Look up John Smith who works at Boeing using the available tools.';

const providers: Array<{ provider: 'claude' | 'openai'; envKey: string }> = [
  { provider: 'claude', envKey: 'ANTHROPIC_API_KEY' },
  { provider: 'openai', envKey: 'OPENAI_API_KEY' },
];

describe('eval: basic name search', () => {
  for (const p of providers) {
    it.skipIf(!process.env[p.envKey])(
      `${p.provider} selects person_search with name+org`,
      async () => {
        const call = await ask({ provider: p.provider, prompt: PROMPT });
        expect(call?.name).toBe('person_search');
        expect((call?.input as { first_names?: string[] }).first_names).toEqual(
          expect.arrayContaining(['John']),
        );
        expect((call?.input as { last_name?: string }).last_name).toBe('Smith');
        expect((call?.input as { organizations?: string[] }).organizations).toEqual(
          expect.arrayContaining(['Boeing']),
        );
      },
    );
  }
});
