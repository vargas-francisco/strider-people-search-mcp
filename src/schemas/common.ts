import { z } from 'zod';

export const resumeFileSchema = z.object({
  fileName: z.string().min(1),
  fileExtension: z.enum(['pdf', 'docx']),
  fileBase64: z.string().min(1),
});

export const jobIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-zA-Z0-9_-]+$/, 'job_id must match [a-zA-Z0-9_-]+');

export type ResumeFile = z.infer<typeof resumeFileSchema>;
