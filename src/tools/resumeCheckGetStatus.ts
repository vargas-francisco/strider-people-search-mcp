import { z } from 'zod';
import { jobIdSchema } from '../schemas/common.js';
import { Runtime } from '../runtime.js';
import { mapAxiosError, ToolResult } from '../envelope.js';

const inputSchema = z.object({ resume_check_job_id: jobIdSchema });

export interface ResumeStatusData {
  status: string;
  message?: string;
  timestamp?: string;
}

export const resumeCheckGetStatus = async (
  raw: unknown,
  runtime: Runtime,
): Promise<ToolResult<ResumeStatusData>> => {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: 'invalid_input', message: parsed.error.issues.map((i) => i.message).join('; ') };
  }
  try {
    const snap = await runtime.client.getResumeStatus(parsed.data.resume_check_job_id);
    return { status: 'ok', data: snap };
  } catch (e) {
    runtime.logger.warn({ err: e }, 'getResumeStatus failed');
    return mapAxiosError(e);
  }
};
