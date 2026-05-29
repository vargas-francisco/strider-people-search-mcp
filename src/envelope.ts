export type ToolErrorCode =
  | 'auth_denied'
  | 'quota_exceeded'
  | 'invalid_input'
  | 'not_found'
  | 'server_error'
  | 'network';

export type ToolError = {
  error: ToolErrorCode;
  message: string;
  retry_hint?: string;
};

export type ToolRunning = {
  status: 'running';
  job_id: string;
  resume_check_job_id?: string;
  retry_with: string;
};

export type ToolOk<T> = {
  status: 'ok';
  data: T;
  resume_check_job_id?: string;
};

export type ToolResult<T> = ToolOk<T> | ToolRunning | ToolError;

interface AxiosLikeError {
  isAxiosError?: boolean;
  response?: { status?: number; data?: { message?: string; error?: string } };
  message?: string;
}

const isAxiosError = (e: unknown): e is AxiosLikeError =>
  typeof e === 'object' && e !== null && (e as AxiosLikeError).isAxiosError === true;

/**
 * Extract a small, safe summary of an axios error suitable for logging.
 * The full axios error carries the request config (including the Bearer
 * token) — never log it raw.
 */
export const safeAxiosErrorSummary = (
  e: unknown,
): { status?: number; method?: string; url?: string; message?: string } => {
  if (!isAxiosError(e)) {
    return { message: (e as { message?: string })?.message };
  }
  const cfg = (e as AxiosLikeError & { config?: { method?: string; url?: string } }).config;
  return {
    status: e.response?.status,
    method: cfg?.method,
    url: cfg?.url,
    message: e.response?.data?.message ?? e.message,
  };
};

export const mapAxiosError = (e: unknown): ToolError => {
  if (!isAxiosError(e)) {
    return { error: 'network', message: (e as { message?: string })?.message ?? 'network error' };
  }
  const status = e.response?.status;
  const message = e.response?.data?.message ?? e.message ?? `HTTP ${status}`;

  if (status === 401) {
    return {
      error: 'auth_denied',
      message,
      retry_hint:
        'verify the Authorization Bearer token is valid and has required Strider Auth0 scopes',
    };
  }
  if (status === 403) {
    if (/quota/i.test(message)) {
      return {
        error: 'quota_exceeded',
        message,
        retry_hint: 'wait for contract year reset or contact your Strider account manager',
      };
    }
    return { error: 'auth_denied', message, retry_hint: 'scope or permission denied' };
  }
  if (status === 404) {
    return { error: 'not_found', message };
  }
  if (status !== undefined && status >= 500) {
    return { error: 'server_error', message, retry_hint: 'transient — retry after a few seconds' };
  }
  return { error: 'network', message };
};
