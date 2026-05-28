# Person Search — Output Field Reference

Tool result shape:

```json
{
  "status": "ok",
  "data": {
    "results": [ ...person matches... ],
    "job_id": "abc123",
    "url": "https://app.striderintel.com/...",
    "search_inputs": { ... }
  },
  "resume_check_job_id": "def456"     // only if a resume check was requested
}
```

`results` is an array because the engine may return multiple match candidates. The
strongest match is typically the first element. Always check confidence indicators
before treating a match as definitive.

## Per-match fields (illustrative; exact shape depends on Sentry version)

| Field             | Description                                                          |
|-------------------|----------------------------------------------------------------------|
| `name`            | Best canonical name for the matched person.                          |
| `aliases`         | Known alternate names.                                               |
| `employment`      | Array of `{ organization, title, start, end }` records.              |
| `education`       | Array of `{ institution, degree, field, start, end }` records.       |
| `risk_signals`    | Array of Strider risk-signal codes triggered for this person.        |
| `sources`         | Citations — URLs, document IDs supporting the data.                  |
| `affiliations`    | Other organizational/personal affiliations.                          |

## Risk signals

Risk signals are coded indicators of elevated risk (e.g., affiliations with
sanctioned entities, military-civil fusion programs, etc.). When summarizing for
the user, always:

1. Quote each risk signal verbatim
2. Cite the underlying source from the `sources` array
3. Do NOT speculate or expand beyond what the data says

## Running status

If `status === "running"`, call `person_search_get_result` with the `job_id`
after a short delay (5–10 seconds). Keep polling until `status === "ok"` or you
get an error envelope.
