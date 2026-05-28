import { describe, expect, it } from 'vitest';
import { screenCandidatePrompt } from '../src/prompts/screenCandidate.js';
import { verifyIdentityPrompt } from '../src/prompts/verifyIdentity.js';
import { resumeAuditPrompt } from '../src/prompts/resumeAudit.js';

describe('prompt templates', () => {
  it('screenCandidate renders with name and employer', () => {
    const rendered = screenCandidatePrompt({ name: 'John Smith', employer: 'Boeing' });
    expect(rendered).toContain('John Smith');
    expect(rendered).toContain('Boeing');
    expect(rendered).toContain('person_search');
  });

  it('verifyIdentity includes claims text', () => {
    const rendered = verifyIdentityPrompt({
      name: 'Jane Doe',
      claims: 'MIT class of 2010, then 5 years at Tesla.',
    });
    expect(rendered).toContain('Jane Doe');
    expect(rendered).toContain('MIT class of 2010');
  });

  it('resumeAudit renders without arguments', () => {
    const rendered = resumeAuditPrompt();
    expect(rendered).toContain('resume');
    expect(rendered).toContain('include_resume_check');
  });
});
