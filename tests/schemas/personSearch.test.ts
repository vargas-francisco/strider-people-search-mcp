import { describe, expect, it } from 'vitest';
import { personSearchInputSchema } from '../../src/schemas/personSearch.js';

describe('personSearchInputSchema', () => {
  it('accepts first_names + last_name + organizations', () => {
    const parsed = personSearchInputSchema.safeParse({
      first_names: ['John'],
      last_name: 'Smith',
      organizations: ['Boeing'],
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts emails only', () => {
    const parsed = personSearchInputSchema.safeParse({ emails: ['j@example.com'] });
    expect(parsed.success).toBe(true);
  });

  it('accepts linkedin only', () => {
    const parsed = personSearchInputSchema.safeParse({ linkedin: 'linkedin.com/in/jdoe' });
    expect(parsed.success).toBe(true);
  });

  it('accepts orcid only', () => {
    const parsed = personSearchInputSchema.safeParse({ orcid: '0000-0001-2345-6789' });
    expect(parsed.success).toBe(true);
  });

  it('rejects when no identification combination is satisfied', () => {
    const parsed = personSearchInputSchema.safeParse({ first_names: ['John'] });
    expect(parsed.success).toBe(false);
  });

  it('rejects first_names + last_name without organizations or educations', () => {
    const parsed = personSearchInputSchema.safeParse({
      first_names: ['John'],
      last_name: 'Smith',
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts first_names + last_name + educations', () => {
    const parsed = personSearchInputSchema.safeParse({
      first_names: ['John'],
      last_name: 'Smith',
      educations: ['MIT'],
    });
    expect(parsed.success).toBe(true);
  });

  it('validates resume_file shape', () => {
    const parsed = personSearchInputSchema.safeParse({
      emails: ['j@example.com'],
      include_resume_check: true,
      resume_file: { fileName: 'cv.pdf', fileExtension: 'pdf', fileBase64: 'aGVsbG8=' },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects unsupported resume file extension', () => {
    const parsed = personSearchInputSchema.safeParse({
      emails: ['j@example.com'],
      include_resume_check: true,
      resume_file: { fileName: 'cv.txt', fileExtension: 'txt', fileBase64: 'aGVsbG8=' },
    });
    expect(parsed.success).toBe(false);
  });
});
