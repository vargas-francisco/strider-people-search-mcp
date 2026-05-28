import { z } from 'zod';
import { jobIdSchema } from '../schemas/common.js';
import { Runtime } from '../runtime.js';
import { mapAxiosError, ToolResult } from '../envelope.js';

const inputSchema = z.object({ resume_check_job_id: jobIdSchema });

export interface ResumeResultData {
  status: string;
  results?: {
    likelihood?: string;
    confidence_score?: number;
    details?: unknown;
  };
}

export const resumeCheckGetResult = async (
  raw: unknown,
  runtime: Runtime,
): Promise<ToolResult<ResumeResultData>> => {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: 'invalid_input',
      message: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }
  try {
    const snap = await runtime.client.getResumeResults(parsed.data.resume_check_job_id);
    return { status: 'ok', data: snap };
  } catch (e) {
    runtime.logger.warn({ err: e }, 'getResumeResults failed');
    return mapAxiosError(e);
  }
};
