# Workflow: Quick Person Lookup

User says something like: "Look up John Smith who works at Boeing."

**Steps:**

1. Call `person_search` with:
   ```json
   { "first_names": ["John"], "last_name": "Smith", "organizations": ["Boeing"] }
   ```
2. If `status === "ok"`: summarize the top match. Include name, current role, and any
   risk signals. Cite sources.
3. If `status === "running"`: tell the user "Strider is processing the search," wait
   ~10 seconds, then call `person_search_get_result` with the returned `job_id`.
4. If `error`: see `docs://errors` for handling.

**Don't:**
- Don't fabricate fields not in the response.
- Don't proceed without identification minimums (see `docs://input-fields`).
- Don't call this tool repeatedly to "improve" — each call consumes quota.
