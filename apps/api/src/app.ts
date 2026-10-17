import express, { Router } from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
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
import { createSession, currentUser, hashPassword, publicUser, requireAuth, verifyPassword } from './auth';
import { errorHandler, HttpError, parse } from './http';
import * as service from './service';
import { Store, type StoredUser } from './store';

export function createApp(store: Store, options: { staticDir?: string } = {}) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  const api = Router();
  const auth = requireAuth(store);

  api.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Auth

  api.post('/auth/register', (req, res) => {
    const input = parse(registerSchema, req.body);
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
    res.status(201).json({ token, user: publicUser(user) });
  });

  api.post('/auth/login', (req, res) => {
    const input = parse(loginSchema, req.body);
    const user = store.data.users.find((u) => u.email === input.email);
    if (!user || !verifyPassword(input.password, user.passwordHash)) throw new HttpError(401, 'Wrong email or password');
    res.json({ token: createSession(store, user.id), user: publicUser(user) });
  });

  api.post('/auth/logout', auth, (_req, res) => {
    store.data.sessions = store.data.sessions.filter((s) => s.token !== res.locals.token);
    store.save();
    res.status(204).end();
  });

  // Profile

  api.get('/me', auth, (_req, res) => {
    const user = currentUser(res);
    const profile = user.role === 'candidate' ? store.candidate(user.id) : store.employer(user.id);
    res.json({ user: publicUser(user), profile: profile ?? null, standoutsRemaining: service.standoutsRemaining(store, user) });
  });

  api.put('/me/profile', auth, (req, res) => {
    const user = currentUser(res);
    if (user.role === 'candidate') {
      const profile: CandidateProfile = { ...parse(candidateProfileSchema, req.body), userId: user.id };
      store.data.candidates = [...store.data.candidates.filter((c) => c.userId !== user.id), profile];
      store.save();
      res.json(profile);
    } else {
      const profile: EmployerProfile = { ...parse(employerProfileSchema, req.body), userId: user.id };
      store.data.employers = [...store.data.employers.filter((e) => e.userId !== user.id), profile];
      store.save();
      res.json(profile);
    }
  });

  // Jobs (employers)

  api.get('/jobs/mine', auth, (_req, res) => {
    const user = currentUser(res, 'employer');
    res.json(store.data.jobs.filter((j) => j.employerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });

  api.post('/jobs', auth, (req, res) => {
    const user = currentUser(res, 'employer');
    if (!store.employer(user.id)) throw new HttpError(409, 'Finish your company profile first');
    const job: Job = { ...parse(jobSchema, req.body), id: Store.id(), employerId: user.id, createdAt: new Date().toISOString() };
    store.data.jobs.push(job);
    store.save();
    res.status(201).json(job);
  });

  api.get('/jobs/:id', auth, (req, res) => {
    const job = store.job(req.params.id as string);
    if (!job) throw new HttpError(404, 'Job not found');
    res.json({ job, employer: store.employer(job.employerId) });
  });

  api.put('/jobs/:id', auth, (req, res) => {
    const user = currentUser(res, 'employer');
    const job = store.job(req.params.id as string);
    if (!job || job.employerId !== user.id) throw new HttpError(404, 'Job not found');
    Object.assign(job, parse(jobSchema, req.body));
    store.save();
    res.json(job);
  });

  // Discovery

  api.get('/feed', auth, (req, res) => {
    const user = currentUser(res);
    if (user.role === 'candidate') {
      res.json(service.candidateFeed(store, user.id));
    } else {
      const jobId = typeof req.query.jobId === 'string' ? req.query.jobId : undefined;
      if (!jobId) throw new HttpError(400, 'jobId: Choose which job you are hiring for');
      res.json(service.employerFeed(store, user.id, jobId));
    }
  });

  api.get('/likes', auth, (_req, res) => {
    res.json(service.likesFor(store, currentUser(res)));
  });

  api.post('/swipes', auth, (req, res) => {
    res.status(201).json(service.recordSwipe(store, currentUser(res), parse(swipeSchema, req.body)));
  });

  // Matches, chat and interviews

  api.get('/matches', auth, (_req, res) => {
    res.json(service.matchSummaries(store, currentUser(res)));
  });

  api.get('/matches/:id', auth, (req, res) => {
    res.json(service.matchDetail(store, currentUser(res), req.params.id as string));
  });

  api.post('/matches/:id/messages', auth, (req, res) => {
    const { body } = parse(messageSchema, req.body);
    res.status(201).json(service.sendMessage(store, currentUser(res), req.params.id as string, body));
  });

  api.post('/matches/:id/interview', auth, (req, res) => {
    const input = parse(interviewProposalSchema, req.body);
    res.status(201).json(service.proposeInterview(store, currentUser(res), req.params.id as string, input));
  });

  api.post('/matches/:id/interview/accept', auth, (req, res) => {
    const { slot } = parse(interviewAcceptSchema, req.body);
    res.json(service.acceptInterview(store, currentUser(res), req.params.id as string, slot));
  });

  api.post('/matches/:id/interview/decline', auth, (req, res) => {
    res.json(service.declineInterview(store, currentUser(res), req.params.id as string));
  });

  api.post('/matches/:id/interview/cancel', auth, (req, res) => {
    res.json(service.cancelInterview(store, currentUser(res), req.params.id as string));
  });

  api.post('/matches/:id/unmatch', auth, (req, res) => {
    service.unmatch(store, currentUser(res), req.params.id as string);
    res.status(204).end();
  });

  api.use((_req, _res) => {
    throw new HttpError(404, 'Not found');
  });

  app.use('/api', api);

  // In production the API also serves the built web app.
  if (options.staticDir && existsSync(options.staticDir)) {
    app.use(express.static(options.staticDir));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(join(options.staticDir!, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
