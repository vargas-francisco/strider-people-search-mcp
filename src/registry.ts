import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { Runtime } from './runtime.js';
import { personSearch } from './tools/personSearch.js';
import { personSearchGetResult } from './tools/personSearchGetResult.js';
import { resumeCheckGetStatus } from './tools/resumeCheckGetStatus.js';
import { resumeCheckGetResult } from './tools/resumeCheckGetResult.js';
import { screenCandidatePrompt } from './prompts/screenCandidate.js';
import { verifyIdentityPrompt } from './prompts/verifyIdentity.js';
import { resumeAuditPrompt } from './prompts/resumeAudit.js';
import { personSearchInputSchema } from './schemas/personSearch.js';
import { jobIdSchema } from './schemas/common.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESOURCES_DIR = join(__dirname, 'resources');

const readResource = (relativePath: string): string =>
  readFileSync(join(RESOURCES_DIR, relativePath), 'utf-8');

export interface ResourceEntry {
  uri: string;
  name: string;
  description: string;
  mimeType: 'text/markdown';
  contents: string;
}

export interface PromptEntry {
  name: string;
  description: string;
  arguments: Array<{ name: string; description: string; required: boolean }>;
  render: (args: Record<string, string>) => string;
}

export interface ToolEntry {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  handler: (input: unknown, runtime: Runtime) => Promise<unknown>;
}

export const listResources = (): ResourceEntry[] => [
  {
    uri: 'docs://overview',
    name: 'Overview',
    description: 'What this MCP does, when to use it, and high-level workflow.',
    mimeType: 'text/markdown',
    contents: readResource('overview.md'),
  },
  {
    uri: 'docs://input-fields',
    name: 'Input field reference',
    description: 'Field-by-field reference for person_search inputs, with examples.',
    mimeType: 'text/markdown',
    contents: readResource('input-fields.md'),
  },
  {
    uri: 'docs://output-fields',
    name: 'Output field reference',
    description: 'Result schema, what each field means, risk signal handling.',
    mimeType: 'text/markdown',
    contents: readResource('output-fields.md'),
  },
  {
    uri: 'docs://workflows/quick-search',
    name: 'Workflow — quick search',
    description: 'How to perform a lookup by name + employer.',
    mimeType: 'text/markdown',
    contents: readResource('workflows/quick-search.md'),
  },
  {
    uri: 'docs://workflows/identity-verification',
    name: 'Workflow — identity verification',
    description: 'Verify that a person matches claimed background.',
    mimeType: 'text/markdown',
    contents: readResource('workflows/identity-verification.md'),
  },
  {
    uri: 'docs://workflows/resume-audit',
    name: 'Workflow — resume audit',
    description: 'Run person search + resume falsification together.',
    mimeType: 'text/markdown',
    contents: readResource('workflows/resume-audit.md'),
  },
  {
    uri: 'docs://errors',
    name: 'Error envelope reference',
    description: 'Every error code with recovery guidance.',
    mimeType: 'text/markdown',
    contents: readResource('errors.md'),
  },
  {
    uri: 'docs://quota',
    name: 'Quota guide',
    description: 'How quota is consumed and what to do when exhausted.',
    mimeType: 'text/markdown',
    contents: readResource('quota.md'),
  },
  {
    uri: 'docs://privacy',
    name: 'Privacy & data handling',
    description: 'What to send, what not to send, token hygiene.',
    mimeType: 'text/markdown',
    contents: readResource('privacy.md'),
  },
];

export const listPrompts = (): PromptEntry[] => [
  {
    name: 'screen_candidate',
    description: 'Structured candidate screening using person_search.',
    arguments: [
      { name: 'name', description: "Candidate's full name", required: true },
      { name: 'employer', description: 'Current or claimed employer', required: true },
    ],
    render: (args) =>
      screenCandidatePrompt({ name: args.name ?? '', employer: args.employer ?? '' }),
  },
  {
    name: 'verify_identity',
    description: 'Verify specific claims about a person.',
    arguments: [
      { name: 'name', description: "Person's full name", required: true },
      { name: 'claims', description: 'Claims to verify (free text)', required: true },
    ],
    render: (args) => verifyIdentityPrompt({ name: args.name ?? '', claims: args.claims ?? '' }),
  },
  {
    name: 'resume_audit',
    description: 'Person search + resume-falsification analysis end-to-end.',
    arguments: [],
    render: () => resumeAuditPrompt(),
  },
];

const PERSON_SEARCH_DESCRIPTION = `Search for a person using Strider Sentry. Returns a structured profile (biographical, employment, education, affiliations, risk signals).

WHEN TO USE: identity verification, due diligence, background screening, supply-chain personnel checks.

REQUIRED INPUTS: at least ONE of: (first_names + last_name + organizations), (first_names + last_name + educations), emails, orcid, linkedin. Providing more signals improves match quality.

OPTIONAL: include_resume_check=true with resume_file runs a parallel resume-falsification analysis. Requires the read:falsified-resumes scope on your token.

QUOTA: each call consumes one search from the user's annual quota. If exhausted: { error: "quota_exceeded" }.

ASYNC: blocks up to 90s polling internally. On timeout returns { status: "running", job_id } — use person_search_get_result with the job_id.

See also: docs://input-fields, docs://workflows/quick-search, docs://errors.`;

export const listTools = (): ToolEntry[] => [
  {
    name: 'person_search',
    description: PERSON_SEARCH_DESCRIPTION,
    inputSchema: personSearchInputSchema,
    handler: personSearch,
  },
  {
    name: 'person_search_get_result',
    description:
      'Fetch the current state of a previously-started person search. Use this when person_search returned { status: "running", job_id }. Does NOT consume additional quota.',
    inputSchema: z.object({ job_id: jobIdSchema }),
    handler: personSearchGetResult,
  },
  {
    name: 'resume_check_get_status',
    description:
      'Check the lightweight status of a resume-falsification analysis. Returns pending/processing/completed/failed. Call this in a loop until completed, then call resume_check_get_result.',
    inputSchema: z.object({ resume_check_job_id: jobIdSchema }),
    handler: resumeCheckGetStatus,
  },
  {
    name: 'resume_check_get_result',
    description:
      'Fetch the resume-falsification verdict and supporting details. Call only after resume_check_get_status reports completed.',
    inputSchema: z.object({ resume_check_job_id: jobIdSchema }),
    handler: resumeCheckGetResult,
  },
];
