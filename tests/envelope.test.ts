import { describe, expect, it } from 'vitest';
import { mapAxiosError, ToolResult } from '../src/envelope.js';

const axiosError = (status: number, message = 'boom'): unknown => ({
  isAxiosError: true,
  response: { status, data: { message } },
  message,
});

describe('mapAxiosError', () => {
  it('maps 401 to auth_denied', () => {
    const result = mapAxiosError(axiosError(401)) as Extract<
      ToolResult<unknown>,
      { error: string }
    >;
    expect(result.error).toBe('auth_denied');
  });

  it('maps 403 with quota message to quota_exceeded', () => {
    const result = mapAxiosError(
      axiosError(403, 'Number of searches exceeds request quota'),
    ) as Extract<ToolResult<unknown>, { error: string }>;
    expect(result.error).toBe('quota_exceeded');
  });

  it('maps 404 to not_found', () => {
    const r = mapAxiosError(axiosError(404)) as Extract<ToolResult<unknown>, { error: string }>;
    expect(r.error).toBe('not_found');
  });

  it('maps 5xx to server_error', () => {
    const r = mapAxiosError(axiosError(503)) as Extract<ToolResult<unknown>, { error: string }>;
    expect(r.error).toBe('server_error');
  });

  it('maps unknown errors to network', () => {
    const r = mapAxiosError({ message: 'ECONNRESET' }) as Extract<
      ToolResult<unknown>,
      { error: string }
    >;
    expect(r.error).toBe('network');
  });
});
