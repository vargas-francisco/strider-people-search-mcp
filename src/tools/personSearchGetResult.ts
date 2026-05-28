import { z } from 'zod';
import { jobIdSchema } from '../schemas/common.js';
import { Runtime } from '../runtime.js';
import { mapAxiosError, ToolResult } from '../envelope.js';

const inputSchema = z.object({ job_id: jobIdSchema });

export interface PersonSearchResultData {
  results: unknown[];
  job_id: string;
  url?: string;
}

export const personSearchGetResult = async (
  raw: unknown,
  runtime: Runtime,
): Promise<ToolResult<PersonSearchResultData>> => {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: 'invalid_input',
      message: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }
  try {
    const snap = await runtime.client.getPersonSearchJob(parsed.data.job_id);
    if (snap.status === 'processed') {
      return {
        status: 'ok',
        data: { results: snap.results ?? [], job_id: snap.job_id, url: snap.url },
      };
    }
    if (snap.status === 'failed') {
      return { error: 'server_error', message: 'job failed', retry_hint: 'submit a new search' };
    }
    return {
      status: 'running',
      job_id: snap.job_id,
      retry_with: 'person_search_get_result',
    };
  } catch (e) {
    runtime.logger.warn({ err: e }, 'getPersonSearchJob failed');
    return mapAxiosError(e);
  }
};
