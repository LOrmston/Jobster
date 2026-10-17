import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { JobFeedItem, LikeItem, MatchDetail, MatchSummary } from '@jobster/shared';
import { createApp } from '../src/app';
import { seed, DEMO_CANDIDATE_EMAIL, DEMO_EMPLOYER_EMAIL, DEMO_PASSWORD } from '../src/seed';
import { Store } from '../src/store';

let server: Server;
let base: string;

beforeAll(async () => {
  server = createApp(new Store()).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${(server.address() as AddressInfo).port}/api`;
});

afterAll(() => {
  server.close();
});

async function call<T = unknown>(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: (text ? JSON.parse(text) : null) as T };
}

const candidateProfile = {
  name: 'Grace Hopper',
  headline: 'Compiler whisperer',
  location: 'London, UK',
  avatarColor: '#123456',
  yearsExperience: 7,
  seniority: 'senior',
  skills: ['TypeScript', 'React', 'Node.js'],
  industries: [],
  workModes: ['remote'],
  jobTypes: ['full_time'],
  salaryMin: 60000,
  willingToRelocate: false,
  rightToWork: true,
  experience: [],
  prompts: [{ question: 'I do my best work when…', answer: 'The bug is reproducible.' }],
  dealbreakers: { workMode: true, salary: false, jobType: false },
};

const jobInput = {
  title: 'Platform Engineer',
  summary: 'Keep the lights on.',
  location: 'London',
  workMode: 'remote',
  jobType: 'full_time',
  salaryMin: 60000,
  salaryMax: 80000,
  seniority: 'senior',
  minYears: 5,
  requiredSkills: ['TypeScript', 'Node.js'],
  niceToHaveSkills: [],
  industry: 'Software',
  perks: [],
  prompts: [{ question: 'A typical day looks like…', answer: 'Coffee, then Kubernetes.' }],
  dealbreakers: { experience: true, rightToWork: true, skills: false },
};

describe('Jobster API: swipe to interview', () => {
  let candidateToken: string;
  let employerToken: string;
  let candidateId: string;
  let jobId: string;
  let matchId: string;

  it('registers both sides and rejects duplicates and bad input', async () => {
    const c = await call<{ token: string; user: { id: string } }>('POST', '/auth/register', {
      email: 'grace@example.com',
      password: 'supersecret',
      role: 'candidate',
    });
    expect(c.status).toBe(201);
    candidateToken = c.body.token;
    candidateId = c.body.user.id;

    const e = await call<{ token: string }>('POST', '/auth/register', { email: 'acme@example.com', password: 'supersecret', role: 'employer' });
    employerToken = e.body.token;

    expect((await call('POST', '/auth/register', { email: 'grace@example.com', password: 'supersecret', role: 'candidate' })).status).toBe(409);
    expect((await call('POST', '/auth/register', { email: 'nope', password: 'x', role: 'candidate' })).status).toBe(400);
    expect((await call('POST', '/auth/login', { email: 'grace@example.com', password: 'wrong-password' })).status).toBe(401);
    expect((await call('GET', '/me')).status).toBe(401);
  });

  it('sets up profiles and a job', async () => {
    expect((await call('GET', '/feed', undefined, candidateToken)).status).toBe(409);
    expect((await call('PUT', '/me/profile', candidateProfile, candidateToken)).status).toBe(200);
    expect(
      (
        await call(
          'PUT',
          '/me/profile',
          { companyName: 'Acme', tagline: 'We make everything', about: 'Roadrunner-proof since 1949.', industry: 'Software', size: '11-50', location: 'London', logoEmoji: '🧨' },
          employerToken,
        )
      ).status,
    ).toBe(200);
    expect((await call('POST', '/jobs', jobInput, candidateToken)).status).toBe(403);
    const job = await call<{ id: string }>('POST', '/jobs', jobInput, employerToken);
    expect(job.status).toBe(201);
    jobId = job.body.id;
  });

  it('shows the job in the candidate feed with a score and hides dealbreakers', async () => {
    await call('POST', '/jobs', { ...jobInput, title: 'Office Manager', workMode: 'onsite' }, employerToken);
    const feed = await call<JobFeedItem[]>('GET', '/feed', undefined, candidateToken);
    expect(feed.body.map((i) => i.job.title)).toEqual(['Platform Engineer']);
    expect(feed.body[0]!.match.score).toBe(100);
    expect(feed.body[0]!.employer.companyName).toBe('Acme');
  });

  it('turns two likes into a match, opening the chat with the like comment', async () => {
    const like = await call<{ match: null }>(
      'POST',
      '/swipes',
      { jobId, decision: 'like', likedSection: 'A typical day looks like…', note: 'Kubernetes before coffee, surely?' },
      candidateToken,
    );
    expect(like.status).toBe(201);
    expect(like.body.match).toBeNull();
    expect((await call('POST', '/swipes', { jobId, decision: 'pass' }, candidateToken)).status).toBe(409);
    expect((await call<JobFeedItem[]>('GET', '/feed', undefined, candidateToken)).body).toHaveLength(0);

    const likes = await call<LikeItem[]>('GET', '/likes', undefined, employerToken);
    expect(likes.body).toHaveLength(1);
    expect(likes.body[0]!.swipe.note).toBe('Kubernetes before coffee, surely?');
    expect(likes.body[0]!.candidate.name).toBe('Grace Hopper');

    const back = await call<{ match: { id: string } }>('POST', '/swipes', { jobId, candidateId, decision: 'like' }, employerToken);
    expect(back.body.match).not.toBeNull();
    matchId = back.body.match.id;
    expect((await call<LikeItem[]>('GET', '/likes', undefined, employerToken)).body).toHaveLength(0);

    const matches = await call<MatchSummary[]>('GET', '/matches', undefined, candidateToken);
    expect(matches.body).toHaveLength(1);
    const detail = await call<MatchDetail>('GET', `/matches/${matchId}`, undefined, employerToken);
    expect(detail.body.messages[0]!.body).toContain('Kubernetes before coffee');
    expect(detail.body.yourTurn).toBe(true);
  });

  it('chats and books an interview', async () => {
    expect((await call('POST', `/matches/${matchId}/messages`, { body: 'Hi Grace!' }, employerToken)).status).toBe(201);

    const soon = new Date(Date.now() + 2 * 86400000).toISOString();
    const later = new Date(Date.now() + 3 * 86400000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    const proposal = { format: 'video', durationMinutes: 30, details: 'https://meet.example.com/acme', slots: [soon, later] };

    expect((await call('POST', `/matches/${matchId}/interview`, { ...proposal, slots: [past] }, employerToken)).status).toBe(400);
    expect((await call('POST', `/matches/${matchId}/interview`, proposal, employerToken)).status).toBe(201);
    expect((await call('POST', `/matches/${matchId}/interview`, proposal, employerToken)).status).toBe(409);
    expect((await call('POST', `/matches/${matchId}/interview/accept`, { slot: soon }, employerToken)).status).toBe(403);
    expect((await call('POST', `/matches/${matchId}/interview/accept`, { slot: past }, candidateToken)).status).toBe(400);

    const accepted = await call<{ interview: { status: string; chosenSlot: string } }>(
      'POST',
      `/matches/${matchId}/interview/accept`,
      { slot: later },
      candidateToken,
    );
    expect(accepted.body.interview.status).toBe('scheduled');
    expect(accepted.body.interview.chosenSlot).toBe(later);

    const detail = await call<MatchDetail>('GET', `/matches/${matchId}`, undefined, candidateToken);
    expect(detail.body.messages.at(-1)!.body).toContain('Interview confirmed');
  });

  it('keeps matches private and supports unmatching', async () => {
    const stranger = await call<{ token: string }>('POST', '/auth/register', { email: 'x@example.com', password: 'supersecret', role: 'candidate' });
    expect((await call('GET', `/matches/${matchId}`, undefined, stranger.body.token)).status).toBe(404);
    expect((await call('POST', `/matches/${matchId}/unmatch`, undefined, candidateToken)).status).toBe(204);
    expect((await call<MatchSummary[]>('GET', '/matches', undefined, employerToken)).body).toHaveLength(0);
  });
});

describe('Jobster API: seeded demo world', () => {
  let seeded: Server;
  let url: string;

  beforeAll(async () => {
    const store = new Store();
    seed(store);
    seeded = createApp(store).listen(0);
    await new Promise((resolve) => seeded.once('listening', resolve));
    url = `http://localhost:${(seeded.address() as AddressInfo).port}/api`;
  });

  afterAll(() => {
    seeded.close();
  });

  const login = async (email: string) => {
    const res = await fetch(`${url}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: DEMO_PASSWORD }),
    });
    return ((await res.json()) as { token: string }).token;
  };

  const get = async <T>(path: string, token: string) => (await (await fetch(url + path, { headers: { authorization: `Bearer ${token}` } })).json()) as T;

  it('gives both demo accounts likes, a match and a ranked feed', async () => {
    const candidate = await login(DEMO_CANDIDATE_EMAIL);
    const employer = await login(DEMO_EMPLOYER_EMAIL);

    const likes = await get<LikeItem[]>('/likes', candidate);
    expect(likes.length).toBe(2);
    expect(likes[0]!.swipe.standout).toBe(true);

    const feed = await get<JobFeedItem[]>('/feed', candidate);
    expect(feed.length).toBeGreaterThan(0);
    const scores = feed.map((i) => i.match.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    // Priya's dealbreaker hides on-site roles.
    expect(feed.some((i) => i.job.workMode === 'onsite')).toBe(false);

    expect(await get<MatchSummary[]>('/matches', candidate)).toHaveLength(1);
    expect((await get<LikeItem[]>('/likes', employer)).length).toBe(3);
  });

  it('limits Standouts to one a day', async () => {
    const candidate = await login(DEMO_CANDIDATE_EMAIL);
    const feed = await get<JobFeedItem[]>('/feed', candidate);
    const swipe = (jobId: string) =>
      fetch(`${url}/swipes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${candidate}` },
        body: JSON.stringify({ jobId, decision: 'like', standout: true }),
      });
    expect((await swipe(feed[0]!.job.id)).status).toBe(201);
    expect((await swipe(feed[1]!.job.id)).status).toBe(429);
  });
});
