import { personSearchInputSchema, PersonSearchInput } from '../schemas/personSearch.js';
import { Runtime } from '../runtime.js';
import { mapAxiosError, safeAxiosErrorSummary, ToolResult } from '../envelope.js';
import { pollJob } from '../client/jobs.js';

export interface PersonSearchData {
  results: unknown[];
  job_id: string;
  url?: string;
  search_inputs: PersonSearchInput;
}

export const personSearch = async (
  rawInput: unknown,
  runtime: Runtime,
): Promise<ToolResult<PersonSearchData>> => {
  const parsed = personSearchInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      error: 'invalid_input',
      message: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }
  const input = parsed.data;

  let start;
  try {
    start = await runtime.client.startPersonSearch(input);
  } catch (e) {
    runtime.logger.warn({ err: safeAxiosErrorSummary(e) }, 'startPersonSearch failed');
    return mapAxiosError(e);
  }

  const poll = await pollJob({
    jobId: start.sentry_job_id,
    fetch: async (jid) => runtime.client.getPersonSearchJob(jid),
    isDone: (s) => s.status === 'processed',
    isFailed: (s) => s.status === 'failed',
    timeoutMs: runtime.config.pollTimeoutMs,
    intervalMs: runtime.config.pollIntervalMs,
  });

  if (poll.status === 'done') {
    return {
      status: 'ok',
      data: {
        results: poll.value.results ?? [],
        job_id: poll.value.job_id,
        url: poll.value.url,
        search_inputs: input,
      },
      resume_check_job_id: start.resume_check_job_id,
    };
  }
  if (poll.status === 'failed') {
    return {
      error: 'server_error',
      message: `person search job ${start.sentry_job_id} failed`,
      retry_hint: 'retry with the same inputs after a few seconds',
    };
  }
  return {
    status: 'running',
    job_id: start.sentry_job_id,
    resume_check_job_id: start.resume_check_job_id,
    retry_with: 'person_search_get_result',
  };
};
