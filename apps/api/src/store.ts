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

export const COLLECTIONS = ['users', 'sessions', 'candidates', 'employers', 'jobs', 'swipes', 'matches', 'messages'] as const;

export const emptyDb = (): DbShape => ({
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
 * The in-memory database every request works against. Where the data lives
 * between requests is up to `persist`: a JSON file under Node
 * (file-store.ts) or a Durable Object on Cloudflare (worker.ts). Moving to
 * Postgres or D1 later means replacing this class and the queries in
 * service.ts.
 */
export class Store {
  data: DbShape;

  constructor(
    initial: Partial<DbShape> = {},
    private readonly persist?: (data: DbShape) => void,
  ) {
    this.data = { ...emptyDb(), ...initial };
  }

  get isEmpty(): boolean {
    return this.data.users.length === 0;
  }

  reset(): void {
    this.data = emptyDb();
  }

  save(): void {
    this.persist?.(this.data);
  }

  static id(): string {
    return crypto.randomUUID();
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
