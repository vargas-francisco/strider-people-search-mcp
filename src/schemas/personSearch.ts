import { z } from 'zod';
import { resumeFileSchema } from './common.js';

const baseShape = z.object({
  first_names: z.array(z.string().min(1)).optional(),
  middle_names: z.array(z.string()).optional(),
  last_name: z.string().min(1).optional(),
  native_name: z.string().optional(),
  emails: z.array(z.string().email()).optional(),
  linkedin: z.string().min(1).optional(),
  orcid: z.string().min(1).optional(),
  organizations: z.array(z.string().min(1)).optional(),
  educations: z.array(z.string().min(1)).optional(),
  include_resume_check: z.boolean().optional(),
  resume_file: resumeFileSchema.optional(),
});

const hasMinimumIdentification = (
  data: z.infer<typeof baseShape>,
): { ok: true } | { ok: false; missing: string } => {
  const hasNameWithContext =
    !!data.first_names?.length &&
    !!data.last_name &&
    (!!data.organizations?.length || !!data.educations?.length);
  if (hasNameWithContext) return { ok: true };
  if (data.emails?.length) return { ok: true };
  if (data.orcid) return { ok: true };
  if (data.linkedin) return { ok: true };
  return {
    ok: false,
    missing:
      'provide at least one of: (first_names + last_name + organizations|educations), emails, orcid, linkedin',
  };
};

export const personSearchInputSchema = baseShape.superRefine((data, ctx) => {
  const check = hasMinimumIdentification(data);
  if (!check.ok) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: check.missing });
  }
  if (data.include_resume_check && !data.resume_file) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'include_resume_check=true requires resume_file',
    });
  }
});

export type PersonSearchInput = z.infer<typeof personSearchInputSchema>;
