import { describe, expect, it } from 'vitest';
import { listResources, listPrompts, listTools } from '../src/registry.js';

describe('registry', () => {
  it('lists 9 resources', () => {
    const resources = listResources();
    expect(resources).toHaveLength(9);
    expect(resources.map((r) => r.uri)).toContain('docs://overview');
    expect(resources.map((r) => r.uri)).toContain('docs://workflows/resume-audit');
  });

  it('lists 3 prompts', () => {
    expect(listPrompts().map((p) => p.name)).toEqual([
      'screen_candidate',
      'verify_identity',
      'resume_audit',
    ]);
  });

  it('lists 4 tools', () => {
    expect(listTools().map((t) => t.name)).toEqual([
      'person_search',
      'person_search_get_result',
      'resume_check_get_status',
      'resume_check_get_result',
    ]);
  });
});
