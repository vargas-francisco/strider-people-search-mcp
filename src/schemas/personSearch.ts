import { z } from 'zod';
import { resumeFileSchema } from './common.js';

/**
 * Strider's upstream Tracer API expects `organizations` and `educations` as
 * arrays of objects (`[{name, start_date?, end_date?}]`), NOT arrays of
 * strings — even though Strider's own error message says otherwise.
 *
 * We accept BOTH the simple string form and the rich object form. The client
 * normalizes simple strings into `{name: "..."}` objects before sending to
 * Strider. Agents that don't know about the rich form can keep passing
 * strings.
 */
export const affiliationSchema = z.union([
  z.string().min(1),
  z.object({
    name: z.string().min(1),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }),
]);

export type Affiliation = z.infer<typeof affiliationSchema>;

const baseShape = z.object({
  first_names: z.array(z.string().min(1)).optional(),
  middle_names: z.array(z.string()).optional(),
  last_name: z.string().min(1).optional(),
  native_name: z.string().optional(),
  emails: z.array(z.string().email()).optional(),
  linkedin: z.string().min(1).optional(),
  orcid: z.string().min(1).optional(),
  organizations: z.array(affiliationSchema).optional(),
  educations: z.array(affiliationSchema).optional(),
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
