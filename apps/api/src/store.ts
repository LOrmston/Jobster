import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { CandidateProfile, EmployerProfile, Job, Match, Message, Swipe, User } from '@jobster/shared';

export interface StoredUser extends User {
  passwordHash: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

export interface DbShape {
  users: StoredUser[];
  sessions: Session[];
  candidates: CandidateProfile[];
  employers: EmployerProfile[];
  jobs: Job[];
  swipes: Swipe[];
  matches: Match[];
  messages: Message[];
}

const empty = (): DbShape => ({
  users: [],
  sessions: [],
  candidates: [],
  employers: [],
  jobs: [],
  swipes: [],
  matches: [],
  messages: [],
});

/**
 * A small JSON-file store so the MVP runs with zero infrastructure. Every
 * read and write goes through this class, so swapping it for Postgres later
 * only touches this file and the route handlers' calls into it.
 */
export class Store {
  data: DbShape;

  constructor(private readonly file?: string) {
    this.data = file && existsSync(file) ? { ...empty(), ...JSON.parse(readFileSync(file, 'utf8')) } : empty();
  }

  get isEmpty(): boolean {
    return this.data.users.length === 0;
  }

  reset(): void {
    this.data = empty();
  }

  save(): void {
    if (!this.file) return;
    mkdirSync(dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    renameSync(tmp, this.file);
  }

  static id(): string {
    return randomUUID();
  }

  user(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  candidate(userId: string) {
    return this.data.candidates.find((c) => c.userId === userId);
  }

  employer(userId: string) {
    return this.data.employers.find((e) => e.userId === userId);
  }

  job(id: string) {
    return this.data.jobs.find((j) => j.id === id);
  }

  match(id: string) {
    return this.data.matches.find((m) => m.id === id);
  }

  swipe(jobId: string, candidateId: string, actor: Swipe['actor']) {
    return this.data.swipes.find((s) => s.jobId === jobId && s.candidateId === candidateId && s.actor === actor);
  }

  matchFor(jobId: string, candidateId: string) {
    return this.data.matches.find((m) => m.jobId === jobId && m.candidateId === candidateId);
  }
}
