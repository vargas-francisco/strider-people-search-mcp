import axios, { AxiosInstance } from 'axios';
import { Affiliation, PersonSearchInput } from '../schemas/personSearch.js';

/**
 * Normalize an array of strings-or-affiliation-objects into the object-shape
 * Tracer requires. Strider's docs say `["Acme Corp"]` is valid, but Tracer's
 * underlying validator wants `[{name: "Acme Corp"}]` and rejects strings with
 * a misleading generic "provide identification" error.
 */
const normalizeAffiliations = (
  items: Affiliation[],
): Array<{ name: string; start_date?: string; end_date?: string }> =>
  items.map((item) => (typeof item === 'string' ? { name: item } : item));

export interface StriderClientOptions {
  baseUrl: string;
  token: string;
  timeoutMs?: number;
}

export interface StartPersonSearchResult {
  sentry_job_id: string;
  resume_check_job_id?: string;
}

export interface PersonSearchJobResult {
  status: 'processed' | 'processing' | 'queued' | 'failed' | string;
  results?: unknown[];
  job_id: string;
  url?: string;
  match_found?: boolean;
  has_risk?: boolean;
  num_profiles?: number;
  num_profiles_with_risk?: number;
  inputs?: unknown;
}

export interface ResumeCheckStatusResult {
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  message?: string;
  timestamp?: string;
}

export interface ResumeCheckResultsResult {
  status: 'completed' | 'failed' | string;
  results?: {
    likelihood?: string;
    confidence_score?: number;
    details?: unknown;
  };
}

export interface StriderClient {
  startPersonSearch(input: PersonSearchInput): Promise<StartPersonSearchResult>;
  getPersonSearchJob(jobId: string): Promise<PersonSearchJobResult>;
  getResumeStatus(jobId: string): Promise<ResumeCheckStatusResult>;
  getResumeResults(jobId: string): Promise<ResumeCheckResultsResult>;
}

export const createStriderClient = (opts: StriderClientOptions): StriderClient => {
  const http: AxiosInstance = axios.create({
    baseURL: opts.baseUrl,
    timeout: opts.timeoutMs ?? 30_000,
    headers: { Authorization: `Bearer ${opts.token}` },
  });

  // Optional wire-level debug logging — set DEBUG_REQUESTS=true to see exact
  // request bodies and response status/data. The Authorization header is
  // explicitly stripped before logging.
  if (process.env.DEBUG_REQUESTS === 'true') {
    http.interceptors.request.use((cfg) => {
      console.error(
        JSON.stringify({
          dbg: 'request',
          method: cfg.method,
          url: cfg.url,
          body: cfg.data,
        }),
      );
      return cfg;
    });
    http.interceptors.response.use(
      (res) => {
        console.error(
          JSON.stringify({
            dbg: 'response',
            status: res.status,
            url: res.config.url,
            body: res.data,
          }),
        );
        return res;
      },
      (err) => {
        console.error(
          JSON.stringify({
            dbg: 'response-error',
            status: err.response?.status,
            url: err.config?.url,
            body: err.response?.data,
          }),
        );
        throw err;
      },
    );
  }

  return {
    async startPersonSearch(input) {
      // Build the canonical Tracer payload. Strider's controller catches any
      // upstream Tracer 400 and replaces the real message with a generic
      // "Provide one of the following combinations…" string, so we can't see
      // Tracer's actual validation error. The defensive thing is to send ONLY
      // populated fields (no empty strings or empty arrays) so Tracer's
      // validator can't interpret an empty value as "user is asserting
      // empty", and to always send `always_include_catchall: true` which is
      // present in every Tracer-bound payload in report-ui.
      const body: Record<string, unknown> = { always_include_catchall: true };
      if (input.first_names && input.first_names.length > 0) {
        body.first_names = input.first_names;
      }
      if (input.middle_names && input.middle_names.length > 0) {
        body.middle_names = input.middle_names;
      }
      if (input.last_name && input.last_name.length > 0) {
        body.last_name = input.last_name;
      }
      if (input.native_name && input.native_name.length > 0) {
        body.native_name = input.native_name;
      }
      if (input.linkedin && input.linkedin.length > 0) {
        body.linkedin = input.linkedin;
      }
      if (input.emails && input.emails.length > 0) {
        body.emails = input.emails;
      }
      if (input.orcid && input.orcid.length > 0) {
        body.orcid = input.orcid;
      }
      if (input.organizations && input.organizations.length > 0) {
        body.organizations = normalizeAffiliations(input.organizations);
      }
      if (input.educations && input.educations.length > 0) {
        body.educations = normalizeAffiliations(input.educations);
      }
      if (input.include_resume_check && input.resume_file) {
        body.upload_resume_file = true;
        body.resume_file = input.resume_file;
      }
      const { data } = await http.post('/api/async/people-search', body);
      return {
        sentry_job_id: data?.sentryData?.data?.job_id,
        resume_check_job_id: data?.resumeCheck?.data?.mystique_job,
      };
    },
    async getPersonSearchJob(jobId) {
      const { data } = await http.get(
        `/api/async/people-search/job/${encodeURIComponent(jobId)}`,
      );
      // Strider response shape:
      //   { sentryData: { data: { status, request_information: {...}, job_id, request_id, inputs }, url } }
      // Hoist the useful fields to a flat shape our tool layer expects.
      const inner = data?.sentryData?.data ?? {};
      const info = inner?.request_information ?? {};
      return {
        status: inner?.status,
        job_id: inner?.job_id ?? jobId,
        url: data?.sentryData?.url,
        results: info?.profile_summaries ?? [],
        match_found: info?.match_found,
        has_risk: info?.has_risk,
        num_profiles: info?.num_profiles,
        num_profiles_with_risk: info?.num_profiles_with_risk,
        inputs: inner?.inputs,
      };
    },
    async getResumeStatus(jobId) {
      const { data } = await http.post(
        `/api/async/people-search/get-resume-status/${encodeURIComponent(jobId)}`,
      );
      return data;
    },
    async getResumeResults(jobId) {
      const { data } = await http.post(
        `/api/async/people-search/get-resume-results/${encodeURIComponent(jobId)}`,
      );
      return data;
    },
  };
};
