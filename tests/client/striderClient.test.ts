import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createStriderClient } from '../../src/client/striderClient.js';

const BASE = 'https://app.striderintel.com';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createStriderClient', () => {
  it('starts a person search and returns sentry + resume job ids', async () => {
    server.use(
      http.post(`${BASE}/api/async/people-search`, async ({ request }) => {
        const auth = request.headers.get('authorization');
        expect(auth).toBe('Bearer tk');
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.emails).toEqual(['j@example.com']);
        return HttpResponse.json({
          sentryData: { data: { job_id: 'sentry-1' } },
          resumeCheck: { data: { mystique_job: 'resume-1' } },
        });
      }),
    );
    const client = createStriderClient({ baseUrl: BASE, token: 'tk' });
    const res = await client.startPersonSearch({ emails: ['j@example.com'] });
    expect(res.sentry_job_id).toBe('sentry-1');
    expect(res.resume_check_job_id).toBe('resume-1');
  });

  it('fetches a person search job result', async () => {
    server.use(
      http.get(`${BASE}/api/async/people-search/job/abc`, () =>
        HttpResponse.json({
          sentryData: { status: 'processed', results: [{ name: 'John' }], job_id: 'abc' },
        }),
      ),
    );
    const client = createStriderClient({ baseUrl: BASE, token: 'tk' });
    const res = await client.getPersonSearchJob('abc');
    expect(res.status).toBe('processed');
    expect(res.results).toHaveLength(1);
  });

  it('propagates 401 as an error', async () => {
    server.use(
      http.get(`${BASE}/api/async/people-search/job/x`, () =>
        HttpResponse.json({ message: 'denied' }, { status: 401 }),
      ),
    );
    const client = createStriderClient({ baseUrl: BASE, token: 'bad' });
    await expect(client.getPersonSearchJob('x')).rejects.toMatchObject({
      isAxiosError: true,
      response: { status: 401 },
    });
  });
});
