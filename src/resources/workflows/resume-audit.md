# Workflow: Resume Audit

User uploads a resume and asks: "Verify this person's resume."

**Steps:**

1. Extract identifying info from the resume (name, employer history).
2. Call `person_search` with `include_resume_check: true` and the resume as
   `resume_file` (base64-encoded).
3. The tool returns a `resume_check_job_id`. The Sentry side may complete first
   (you get `status === "ok"` with results) or both may still be running.
4. For the resume side: poll `resume_check_get_status` with `resume_check_job_id`.
   Keep polling until status is `completed` or `failed`.
5. Once completed, call `resume_check_get_result` to get the verdict
   (`likely_falsified` | `unlikely_falsified` plus `confidence_score`).
6. Report:
   - Sentry-side findings: employment/education matches, risk signals.
   - Resume falsification verdict + confidence + supporting details.
7. Always recommend human review for high-stakes hiring decisions — this is a
   signal, not a decision.

**Scope requirement:** the resume tools require the `read:falsified-resumes` scope
on the user's Auth0 token. If `error === "auth_denied"`, advise the user to request
that scope.
