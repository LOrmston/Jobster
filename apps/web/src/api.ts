import type {
  AuthResponse,
  CandidateFeedItem,
  CandidateProfile,
  CandidateProfileInput,
  EmployerProfile,
  EmployerProfileInput,
  InterviewProposalInput,
  Job,
  JobFeedItem,
  JobInput,
  LikeItem,
  Match,
  MatchDetail,
  MatchSummary,
  Message,
  Role,
  SwipeInput,
  SwipeResponse,
  User,
} from '@jobster/shared';

const TOKEN_KEY = 'jobster.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private browsing: the session simply won't survive a reload.
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Fired when the server rejects our token, so the app can return to sign-in. */
export const UNAUTHORISED_EVENT = 'jobster:unauthorised';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event(UNAUTHORISED_EVENT));
    }
    throw new ApiError(res.status, (data as { error?: string }).error ?? 'Something went wrong');
  }
  return data as T;
}

export interface Me {
  user: User;
  profile: CandidateProfile | EmployerProfile | null;
  standoutsRemaining: number;
}

export const api = {
  register: (email: string, password: string, role: Role) => request<AuthResponse>('POST', '/auth/register', { email, password, role }),
  login: (email: string, password: string) => request<AuthResponse>('POST', '/auth/login', { email, password }),
  logout: () => request<void>('POST', '/auth/logout'),
  me: () => request<Me>('GET', '/me'),
  saveProfile: (profile: CandidateProfileInput | EmployerProfileInput) => request<CandidateProfile | EmployerProfile>('PUT', '/me/profile', profile),

  myJobs: () => request<Job[]>('GET', '/jobs/mine'),
  createJob: (job: JobInput) => request<Job>('POST', '/jobs', job),
  updateJob: (id: string, job: JobInput) => request<Job>('PUT', `/jobs/${id}`, job),

  jobFeed: () => request<JobFeedItem[]>('GET', '/feed'),
  candidateFeed: (jobId: string) => request<CandidateFeedItem[]>('GET', `/feed?jobId=${encodeURIComponent(jobId)}`),
  likes: () => request<LikeItem[]>('GET', '/likes'),
  swipe: (input: SwipeInput) => request<SwipeResponse>('POST', '/swipes', input),

  matches: () => request<MatchSummary[]>('GET', '/matches'),
  match: (id: string) => request<MatchDetail>('GET', `/matches/${id}`),
  sendMessage: (id: string, body: string) => request<Message>('POST', `/matches/${id}/messages`, { body }),
  proposeInterview: (id: string, input: InterviewProposalInput) => request<Match>('POST', `/matches/${id}/interview`, input),
  acceptInterview: (id: string, slot: string) => request<Match>('POST', `/matches/${id}/interview/accept`, { slot }),
  declineInterview: (id: string) => request<Match>('POST', `/matches/${id}/interview/decline`),
  cancelInterview: (id: string) => request<Match>('POST', `/matches/${id}/interview/cancel`),
  unmatch: (id: string) => request<void>('POST', `/matches/${id}/unmatch`),
};
