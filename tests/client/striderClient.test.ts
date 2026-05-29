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

  it('fetches a person search job result and flattens the real Strider response shape', async () => {
    server.use(
      http.get(`${BASE}/api/async/people-search/job/abc`, () =>
        HttpResponse.json({
          // The real shape returned by Strider (see docs/SMOKE-TEST.md probes):
          // sentryData.data carries status + request_information; sentryData.url
          // is the deep-link.
          sentryData: {
            data: {
              status: 'processed',
              job_id: 'abc',
              request_id: 'req-abc',
              inputs: { emails: ['j@example.com'] },
              request_information: {
                match_found: true,
                has_risk: false,
                num_profiles: 1,
                num_profiles_with_risk: 0,
                profile_summaries: [{ name: 'John', profile_risk: {} }],
              },
            },
            url: 'https://app.striderintel.com/search-people/person:person?xyz',
          },
        }),
      ),
    );
    const client = createStriderClient({ baseUrl: BASE, token: 'tk' });
    const res = await client.getPersonSearchJob('abc');
    expect(res.status).toBe('processed');
    expect(res.job_id).toBe('abc');
    expect(res.results).toHaveLength(1);
    expect(res.match_found).toBe(true);
    expect(res.num_profiles).toBe(1);
    expect(res.url).toContain('https://');
  });

  it('normalizes string-form organizations into object form for Tracer', async () => {
    server.use(
      http.post(`${BASE}/api/async/people-search`, async ({ request }) => {
        const body = (await request.json()) as { organizations: unknown[] };
        // The client must wrap strings into {name: ...} objects because
        // Strider's upstream rejects plain strings here.
        expect(body.organizations).toEqual([{ name: 'Boeing' }]);
        return HttpResponse.json({ sentryData: { data: { job_id: 'wrapped' } } });
      }),
    );
    const client = createStriderClient({ baseUrl: BASE, token: 'tk' });
    const res = await client.startPersonSearch({
      first_names: ['John'],
      last_name: 'Smith',
      organizations: ['Boeing'],
    });
    expect(res.sentry_job_id).toBe('wrapped');
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
