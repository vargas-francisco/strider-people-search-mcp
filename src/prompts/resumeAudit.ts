export const resumeAuditPrompt = (): string =>
  `
You are auditing a candidate's resume using Strider's people-search MCP with
resume-falsification analysis.

Ask the user to provide:
- The candidate's name
- The resume file (PDF or DOCX)

Then:
1. Extract identifying info from the resume.
2. Call \`person_search\` with \`include_resume_check: true\` and the resume as
   \`resume_file\` (base64).
3. Poll \`resume_check_get_status\` with the returned \`resume_check_job_id\` until
   status is \`completed\`.
4. Call \`resume_check_get_result\` and report:
   - Likelihood: likely_falsified / unlikely_falsified
   - Confidence score
   - Key supporting details from the analysis
5. Cross-check resume employment/education claims against the Strider
   \`person_search\` result.
6. Recommend HUMAN REVIEW for the final hiring call — this is a signal, not a decision.

If the user's token lacks \`read:falsified-resumes\` scope, you'll get
\`error: auth_denied\`. Tell the user clearly that they need the scope added.
`.trim();
