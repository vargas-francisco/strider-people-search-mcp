import axios, { AxiosInstance } from 'axios';
import { PersonSearchInput } from '../schemas/personSearch.js';

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
  status: 'processed' | 'processing' | 'failed' | string;
  results?: unknown[];
  job_id: string;
  url?: string;
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

  return {
    async startPersonSearch(input) {
      // Build the canonical Tracer payload shape (matches the SPA's Filters.tsx).
      // Tracer rejects unknown fields and requires `always_include_catchall: true`.
      // All identification fields are sent with empty defaults rather than omitted,
      // because Tracer's validation expects the keys to be present.
      const body: Record<string, unknown> = {
        first_names: input.first_names ?? [],
        middle_names: input.middle_names ?? [],
        last_name: input.last_name ?? '',
        linkedin: input.linkedin ?? '',
        emails: input.emails ?? [],
        orcid: input.orcid ?? '',
        organizations: input.organizations ?? [],
        educations: input.educations ?? [],
        always_include_catchall: true,
      };
      if (input.native_name) {
        body.native_name = input.native_name;
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
      const { data } = await http.get(`/api/async/people-search/job/${encodeURIComponent(jobId)}`);
      return data?.sentryData;
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
