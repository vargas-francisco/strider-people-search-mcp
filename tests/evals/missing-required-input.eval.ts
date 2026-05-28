import { describe, expect, it } from 'vitest';
import { ask } from './harness.js';

// Prompt is intentionally underspecified — model should NOT call a tool with
// invalid inputs; it should ask the user for more info.
const PROMPT = 'Search for someone named John.';

const providers: Array<{ provider: 'claude' | 'openai'; envKey: string }> = [
  { provider: 'claude', envKey: 'ANTHROPIC_API_KEY' },
  { provider: 'openai', envKey: 'OPENAI_API_KEY' },
];

describe('eval: missing required input', () => {
  for (const p of providers) {
    it.skipIf(!process.env[p.envKey])(`${p.provider} does NOT invoke a tool prematurely`, async () => {
      const call = await ask({ provider: p.provider, prompt: PROMPT });
      // Either no tool call OR a tool call that the model would expect to fail —
      // we accept "no tool call" (best behavior) and reject calls that would
      // pass schema (which only happens with extra invented data).
      if (call === null) {
        expect(call).toBeNull();
        return;
      }
      // If a tool was called, the input must NOT satisfy any combination —
      // the model would be hallucinating data.
      const input = call.input as Record<string, unknown>;
      const hasName = Array.isArray(input.first_names) && typeof input.last_name === 'string';
      const hasOrgOrEdu =
        (Array.isArray(input.organizations) && (input.organizations as unknown[]).length > 0) ||
        (Array.isArray(input.educations) && (input.educations as unknown[]).length > 0);
      const ok = hasName && hasOrgOrEdu;
      expect(ok, 'model called tool with hallucinated data').toBe(false);
    });
  }
});
