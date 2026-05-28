import { describe, expect, it, beforeEach } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  beforeEach(() => {
    delete process.env.STRIDER_BASE_URL;
    delete process.env.STRIDER_AUTH0_TOKEN;
    delete process.env.STRIDER_AUTH0_TOKEN_URL;
    delete process.env.STRIDER_AUTH0_AUDIENCE;
    delete process.env.STRIDER_AUTH0_CLIENT_ID;
    delete process.env.STRIDER_AUTH0_CLIENT_SECRET;
    delete process.env.MCP_HTTP_PORT;
    delete process.env.MCP_POLL_TIMEOUT_MS;
    delete process.env.MCP_POLL_INTERVAL_MS;
    delete process.env.LOG_LEVEL;
  });

  it('uses sensible defaults', () => {
    const config = loadConfig();
    expect(config.baseUrl).toBe('https://app.striderintel.com');
    expect(config.httpPort).toBe(3000);
    expect(config.pollTimeoutMs).toBe(90_000);
    expect(config.pollIntervalMs).toBe(1_500);
    expect(config.logLevel).toBe('info');
  });

  it('reads STRIDER_BASE_URL when present', () => {
    process.env.STRIDER_BASE_URL = 'https://qa.striderintel.com';
    expect(loadConfig().baseUrl).toBe('https://qa.striderintel.com');
  });

  it('reads STRIDER_AUTH0_TOKEN when present', () => {
    process.env.STRIDER_AUTH0_TOKEN = 'jwt-xyz';
    expect(loadConfig().auth0Token).toBe('jwt-xyz');
  });

  it('parses MCP_POLL_TIMEOUT_MS as integer', () => {
    process.env.MCP_POLL_TIMEOUT_MS = '120000';
    expect(loadConfig().pollTimeoutMs).toBe(120_000);
  });
});
