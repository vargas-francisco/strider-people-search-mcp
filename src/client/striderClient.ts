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
      const body = {
        ...input,
        upload_resume_file: input.include_resume_check === true,
      };
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
