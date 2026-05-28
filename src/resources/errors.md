# Error Envelope Reference

Every tool returns ONE of:

- `{ status: "ok", data: {...} }`
- `{ status: "running", job_id: "...", retry_with: "..." }`
- `{ error: "...", message: "...", retry_hint: "..." }`

## Error codes

| Code              | What it means                                              | Recovery                                                                 |
|-------------------|------------------------------------------------------------|--------------------------------------------------------------------------|
| `auth_denied`     | Token is missing, malformed, or lacks the required scope.  | Tell the user to refresh their token / request needed scope from Strider. |
| `quota_exceeded`  | Annual contract quota is exhausted.                        | Inform the user. Do NOT retry. Suggest contacting their Strider account manager. |
| `invalid_input`   | Required inputs missing or malformed.                      | Read the error `message`; ask the user for the missing field.            |
| `not_found`       | The job_id or resource does not exist.                     | Do not retry; the id is stale or wrong.                                  |
| `server_error`    | Strider's API failed transiently.                          | Wait 5–10s, then retry once. If it persists, surface to the user.        |
| `network`         | The MCP couldn't reach the Strider API.                    | Likely intermittent. Retry once, then surface.                           |

## Running status (not an error)

When `status === "running"`, the API is still computing. Use the named `retry_with`
tool with the `job_id` after a short wait. Do not call the same start tool again —
that consumes additional quota.
