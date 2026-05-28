import { describe, expect, it } from 'vitest';
import { ask } from './harness.js';

const PROMPT = `Audit John Smith's resume. Here is the resume (base64): aGVsbG8gd29ybGQ=
Filename: smith-cv.pdf. He claims to have worked at Boeing.`;

const providers: Array<{ provider: 'claude' | 'openai'; envKey: string }> = [
  { provider: 'claude', envKey: 'ANTHROPIC_API_KEY' },
  { provider: 'openai', envKey: 'OPENAI_API_KEY' },
];

describe('eval: resume audit flow', () => {
  for (const p of providers) {
    it.skipIf(!process.env[p.envKey])(
      `${p.provider} selects person_search with include_resume_check`,
      async () => {
        const call = await ask({ provider: p.provider, prompt: PROMPT });
        expect(call?.name).toBe('person_search');
        const input = call?.input as {
          include_resume_check?: boolean;
          resume_file?: { fileExtension?: string };
        };
        expect(input.include_resume_check).toBe(true);
        expect(input.resume_file?.fileExtension).toBe('pdf');
      },
    );
  }
});
