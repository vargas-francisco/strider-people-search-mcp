# Person Search — Input Field Reference

Every `person_search` call must satisfy ONE of these identification combinations:

1. `first_names` + `last_name` + `organizations`
2. `first_names` + `last_name` + `educations`
3. `emails`
4. `orcid`
5. `linkedin`

Providing MORE fields improves match quality. The Sentry engine de-duplicates and
disambiguates better with more signals.

## Field reference

| Field           | Type      | Notes                                                                |
|-----------------|-----------|----------------------------------------------------------------------|
| `first_names`   | string[]  | All first/given names the person has used. Include nicknames.        |
| `middle_names`  | string[]  | Middle names if known. Optional.                                     |
| `last_name`     | string    | Family name. Single string, not array.                               |
| `native_name`   | string    | Name in original script (e.g., 王明 for a Chinese national).        |
| `emails`        | string[]  | All known email addresses. Must be valid email format.               |
| `linkedin`      | string    | LinkedIn URL or username (e.g., "linkedin.com/in/jdoe" or "jdoe").   |
| `orcid`         | string    | ORCID identifier (researchers).                                      |
| `organizations` | string[] or object[] | Known employers/affiliations (past + present). Pass simple strings (`["Acme Corp"]`) or, for date-bounded affiliations, objects (`[{name: "Acme Corp", start_date: "2019-01", end_date: "2023-08"}]`). The MCP normalizes simple strings into the object form before sending. |
| `educations`    | string[] or object[] | Universities/schools attended. Same string-or-object accepted as `organizations`. |

## Resume verification fields (optional)

| Field                  | Type    | Notes                                              |
|------------------------|---------|----------------------------------------------------|
| `include_resume_check` | boolean | Set true to run resume-falsification analysis.     |
| `resume_file`          | object  | Required when `include_resume_check=true`.         |
| `resume_file.fileName` | string  | Filename (e.g., "smith-cv.pdf").                   |
| `resume_file.fileExtension` | string | "pdf" or "docx" only.                          |
| `resume_file.fileBase64`    | string | Base64-encoded file contents.                  |

## Examples

```json
// By name + employer
{ "first_names": ["John"], "last_name": "Smith", "organizations": ["Boeing"] }

// By email
{ "emails": ["j.smith@boeing.com"] }

// By LinkedIn URL
{ "linkedin": "linkedin.com/in/jsmith42" }

// With resume audit
{
  "first_names": ["John"], "last_name": "Smith", "organizations": ["Boeing"],
  "include_resume_check": true,
  "resume_file": { "fileName": "smith.pdf", "fileExtension": "pdf", "fileBase64": "..." }
}
```
