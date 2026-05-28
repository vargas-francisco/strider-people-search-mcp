# Strider People Search — Overview

You are connected to an MCP that wraps the Strider Sentry people-search API.

**What this does:** given identifying information about a person, returns a structured
profile including biographical data, employment, education, affiliations, and Strider
risk signals. Optionally verifies a resume against the search results to detect
falsification.

**When to use:**
- Identity verification ("does this person match their claimed background?")
- Due diligence on individuals (candidates, vendors, partners, board members)
- Background screening for supply-chain and personnel risk
- Resume audit before hiring decisions

**When NOT to use:**
- General web search — this MCP only returns Strider-curated data
- Looking up organizations — there are dedicated MCPs/endpoints for org search
- Looking up companies' OSS dependencies — use the OSS MCP

**Workflow:**
1. Call `person_search` with identifying info (see resource `docs://input-fields`).
2. If the tool returns `{ status: "ok" }`, summarize the result for the user.
3. If it returns `{ status: "running" }`, wait ~10 seconds, then call `person_search_get_result` with the `job_id`.
4. For resume audits, call `resume_check_get_status` until it reports `completed`, then `resume_check_get_result`.

**Quota:** each successful person search consumes one quota unit from the user's
annual contract allocation. See `docs://quota`.

**Privacy:** send only minimum identifying information. See `docs://privacy`.
