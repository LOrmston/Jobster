import { Hono } from 'hono';
import {
  candidateProfileSchema,
  employerProfileSchema,
  interviewAcceptSchema,
  interviewProposalSchema,
  jobSchema,
  loginSchema,
  messageSchema,
  registerSchema,
  swipeSchema,
  type CandidateProfile,
  type EmployerProfile,
  type Job,
} from '@jobster/shared';
import { createSession, currentUser, hashPassword, publicUser, requireAuth, verifyPassword, type AppEnv } from './auth';
import { errorHandler, HttpError, parse, readJson } from './http';
import * as service from './service';
import { Store, type StoredUser } from './store';

/**
 * The Jobster REST API. It only uses web-standard Request/Response, so the
 * same app runs under Node (index.ts) and on Cloudflare Workers (worker.ts).
 */
export function createApp(store: Store) {
  const app = new Hono<AppEnv>();
  const auth = requireAuth(store);

  app.get('/api/health', (c) => c.json({ ok: true }));

  // Auth

  app.post('/api/auth/register', async (c) => {
    const input = parse(registerSchema, await readJson(c));
    if (store.data.users.some((u) => u.email === input.email)) throw new HttpError(409, 'That email is already registered');
    const user: StoredUser = {
      id: Store.id(),
      email: input.email,
      role: input.role,
      passwordHash: hashPassword(input.password),
      createdAt: new Date().toISOString(),
    };
    store.data.users.push(user);
    const token = createSession(store, user.id);
    return c.json({ token, user: publicUser(user) }, 201);
  });

  app.post('/api/auth/login', async (c) => {
    const input = parse(loginSchema, await readJson(c));
    const user = store.data.users.find((u) => u.email === input.email);
    if (!user || !verifyPassword(input.password, user.passwordHash)) throw new HttpError(401, 'Wrong email or password');
    return c.json({ token: createSession(store, user.id), user: publicUser(user) });
  });

  app.post('/api/auth/logout', auth, (c) => {
    store.data.sessions = store.data.sessions.filter((s) => s.token !== c.get('token'));
    store.save();
    return c.body(null, 204);
  });

  // Profile

  app.get('/api/me', auth, (c) => {
    const user = currentUser(c);
    const profile = user.role === 'candidate' ? store.candidate(user.id) : store.employer(user.id);
    return c.json({ user: publicUser(user), profile: profile ?? null, standoutsRemaining: service.standoutsRemaining(store, user) });
  });

  app.get('/api/me/summary', auth, (c) => c.json(service.attentionSummary(store, currentUser(c))));

  app.put('/api/me/profile', auth, async (c) => {
    const user = currentUser(c);
    const body = await readJson(c);
    if (user.role === 'candidate') {
      const profile: CandidateProfile = { ...parse(candidateProfileSchema, body), userId: user.id };
      store.data.candidates = [...store.data.candidates.filter((p) => p.userId !== user.id), profile];
      store.save();
      return c.json(profile);
    }
    const profile: EmployerProfile = { ...parse(employerProfileSchema, body), userId: user.id };
    store.data.employers = [...store.data.employers.filter((p) => p.userId !== user.id), profile];
    store.save();
    return c.json(profile);
  });

  // Jobs (employers)

  app.get('/api/jobs/mine', auth, (c) => {
    const user = currentUser(c, 'employer');
    return c.json(store.data.jobs.filter((j) => j.employerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });

  app.get('/api/jobs/pipeline', auth, (c) => c.json(service.jobPipeline(store, currentUser(c, 'employer').id)));

  app.post('/api/jobs', auth, async (c) => {
    const user = currentUser(c, 'employer');
    if (!store.employer(user.id)) throw new HttpError(409, 'Finish your company profile first');
    const job: Job = { ...parse(jobSchema, await readJson(c)), id: Store.id(), employerId: user.id, createdAt: new Date().toISOString() };
    store.data.jobs.push(job);
    store.save();
    return c.json(job, 201);
  });

  app.get('/api/jobs/:id', auth, (c) => {
    const job = store.job(c.req.param('id'));
    if (!job) throw new HttpError(404, 'Job not found');
    return c.json({ job, employer: store.employer(job.employerId) });
  });

  app.put('/api/jobs/:id', auth, async (c) => {
    const user = currentUser(c, 'employer');
    const job = store.job(c.req.param('id'));
    if (!job || job.employerId !== user.id) throw new HttpError(404, 'Job not found');
    Object.assign(job, parse(jobSchema, await readJson(c)));
    store.save();
    return c.json(job);
  });

  // Discovery

  app.get('/api/feed', auth, (c) => {
    const user = currentUser(c);
    if (user.role === 'candidate') return c.json(service.candidateFeed(store, user.id));
    const jobId = c.req.query('jobId');
    if (!jobId) throw new HttpError(400, 'jobId: Choose which job you are hiring for');
    return c.json(service.employerFeed(store, user.id, jobId));
  });

  app.get('/api/likes', auth, (c) => c.json(service.likesFor(store, currentUser(c))));

  app.post('/api/swipes', auth, async (c) => {
    return c.json(service.recordSwipe(store, currentUser(c), parse(swipeSchema, await readJson(c))), 201);
  });

  // Matches, chat and interviews

  app.get('/api/matches', auth, (c) => c.json(service.matchSummaries(store, currentUser(c))));

  app.get('/api/matches/:id', auth, (c) => c.json(service.matchDetail(store, currentUser(c), c.req.param('id'))));

  app.post('/api/matches/:id/messages', auth, async (c) => {
    const { body } = parse(messageSchema, await readJson(c));
    return c.json(service.sendMessage(store, currentUser(c), c.req.param('id'), body), 201);
  });

  app.post('/api/matches/:id/interview', auth, async (c) => {
    const input = parse(interviewProposalSchema, await readJson(c));
    return c.json(service.proposeInterview(store, currentUser(c), c.req.param('id'), input), 201);
  });

  app.post('/api/matches/:id/interview/accept', auth, async (c) => {
    const { slot } = parse(interviewAcceptSchema, await readJson(c));
    return c.json(service.acceptInterview(store, currentUser(c), c.req.param('id'), slot));
  });

  app.post('/api/matches/:id/interview/decline', auth, (c) => c.json(service.declineInterview(store, currentUser(c), c.req.param('id'))));

  app.post('/api/matches/:id/interview/cancel', auth, (c) => c.json(service.cancelInterview(store, currentUser(c), c.req.param('id'))));

  app.post('/api/matches/:id/unmatch', auth, (c) => {
    service.unmatch(store, currentUser(c), c.req.param('id'));
    return c.body(null, 204);
  });

  app.all('/api/*', () => {
    throw new HttpError(404, 'Not found');
  });

  app.onError(errorHandler);
  return app;
}
