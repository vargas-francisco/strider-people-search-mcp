# Tool Reference

(Auto-generated content goes here. For now, this is hand-maintained.)

## `person_search`

Initiate a person search. Blocks up to 90 seconds polling for results.

**Input (one combination required):**

```ts
{
  // Combination A: name + employer
  first_names?: string[]
  last_name?: string
  organizations?: string[]

  // Combination B: name + school
  educations?: string[]

  // Combination C / D / E: any one of
  emails?: string[]
  linkedin?: string
  orcid?: string

  // Always optional
  middle_names?: string[]
  native_name?: string

  // Optional resume audit
  include_resume_check?: boolean
  resume_file?: { fileName: string; fileExtension: 'pdf' | 'docx'; fileBase64: string }
}
```

**Output:**

```ts
| { status: 'ok'; data: { results: any[]; job_id: string; url?: string; search_inputs: ... }; resume_check_job_id?: string }
| { status: 'running'; job_id: string; resume_check_job_id?: string; retry_with: 'person_search_get_result' }
| { error: 'auth_denied' | 'quota_exceeded' | 'invalid_input' | 'server_error' | 'network'; message: string; retry_hint?: string }
```

## `person_search_get_result`

```ts
input  : { job_id: string }
output : ToolResult<{ results: any[]; job_id: string; url?: string }>
```

## `resume_check_get_status`

```ts
input  : { resume_check_job_id: string }
output : ToolResult<{ status: string; message?: string; timestamp?: string }>
```

## `resume_check_get_result`

```ts
input  : { resume_check_job_id: string }
output : ToolResult<{ status: string; results?: { likelihood?: string; confidence_score?: number; details?: any } }>
```
