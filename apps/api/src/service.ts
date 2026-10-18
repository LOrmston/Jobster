import {
  computeMatch,
  type AttentionSummary,
  type JobPipeline,
  INTERVIEW_FORMAT_LABELS,
  type CandidateFeedItem,
  type InterviewProposalInput,
  type JobFeedItem,
  type LikeItem,
  type Match,
  type MatchDetail,
  type MatchSummary,
  type Message,
  type Role,
  type Swipe,
  type SwipeData,
  type SwipeResponse,
} from '@jobster/shared';
import { HttpError } from './http';
import { Store, type StoredUser } from './store';

export const STANDOUTS_PER_DAY = 1;
const FEED_LIMIT = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

const byScore = <T extends { match: { score: number } }>(a: T, b: T) => b.match.score - a.match.score;

function requireCandidate(store: Store, userId: string) {
  const candidate = store.candidate(userId);
  if (!candidate) throw new HttpError(409, 'Finish your profile first');
  return candidate;
}

function requireEmployer(store: Store, userId: string) {
  const employer = store.employer(userId);
  if (!employer) throw new HttpError(409, 'Finish your company profile first');
  return employer;
}

function ownJob(store: Store, employerId: string, jobId: string) {
  const job = store.job(jobId);
  if (!job || job.employerId !== employerId) throw new HttpError(404, 'Job not found');
  return job;
}

/** Jobs a candidate hasn't decided on yet, best matches first. */
export function candidateFeed(store: Store, candidateId: string): JobFeedItem[] {
  const candidate = requireCandidate(store, candidateId);
  const items: JobFeedItem[] = [];
  for (const job of store.data.jobs) {
    if (!job.active) continue;
    if (store.swipe(job.id, candidateId, 'candidate')) continue;
    // Like Hinge, people who have passed on you quietly drop out of your feed.
    if (store.swipe(job.id, candidateId, 'employer')?.decision === 'pass') continue;
    const employer = store.employer(job.employerId);
    if (!employer) continue;
    const match = computeMatch(candidate, job);
    if (!match.eligible) continue;
    items.push({ job, employer, match });
  }
  return items.sort(byScore).slice(0, FEED_LIMIT);
}

/** Candidates an employer hasn't decided on yet for one of their jobs, best matches first. */
export function employerFeed(store: Store, employerId: string, jobId: string): CandidateFeedItem[] {
  requireEmployer(store, employerId);
  const job = ownJob(store, employerId, jobId);
  const items: CandidateFeedItem[] = [];
  for (const candidate of store.data.candidates) {
    if (store.swipe(job.id, candidate.userId, 'employer')) continue;
    if (store.swipe(job.id, candidate.userId, 'candidate')?.decision === 'pass') continue;
    const match = computeMatch(candidate, job);
    if (!match.eligible) continue;
    items.push({ candidate, job, match });
  }
  return items.sort(byScore).slice(0, FEED_LIMIT);
}

/** People who liked you and are waiting on your decision. Standouts first, then newest. */
export function likesFor(store: Store, user: StoredUser): LikeItem[] {
  const other: Role = user.role === 'candidate' ? 'employer' : 'candidate';
  const items: LikeItem[] = [];
  for (const swipe of store.data.swipes) {
    if (swipe.actor !== other || swipe.decision !== 'like') continue;
    const job = store.job(swipe.jobId);
    if (!job) continue;
    const mine = user.role === 'candidate' ? swipe.candidateId === user.id : job.employerId === user.id;
    if (!mine || store.swipe(swipe.jobId, swipe.candidateId, user.role)) continue;
    const candidate = store.candidate(swipe.candidateId);
    const employer = store.employer(job.employerId);
    if (!candidate || !employer) continue;
    items.push({ swipe, job, employer, candidate, match: computeMatch(candidate, job) });
  }
  return items.sort(
    (a, b) => Number(b.swipe.standout) - Number(a.swipe.standout) || b.swipe.createdAt.localeCompare(a.swipe.createdAt),
  );
}

export function standoutsRemaining(store: Store, user: StoredUser): number {
  const since = Date.now() - DAY_MS;
  const used = store.data.swipes.filter((s) => {
    if (!s.standout || s.actor !== user.role || Date.parse(s.createdAt) < since) return false;
    return user.role === 'candidate' ? s.candidateId === user.id : store.job(s.jobId)?.employerId === user.id;
  }).length;
  return Math.max(0, STANDOUTS_PER_DAY - used);
}

export function recordSwipe(store: Store, user: StoredUser, input: SwipeData): SwipeResponse {
  let candidateId: string;
  const job = store.job(input.jobId);
  if (!job) throw new HttpError(404, 'Job not found');

  if (user.role === 'candidate') {
    requireCandidate(store, user.id);
    candidateId = user.id;
    if (!job.active) throw new HttpError(409, 'This job is no longer open');
  } else {
    requireEmployer(store, user.id);
    ownJob(store, user.id, job.id);
    if (!input.candidateId) throw new HttpError(400, 'candidateId: Required');
    if (!store.candidate(input.candidateId)) throw new HttpError(404, 'Candidate not found');
    candidateId = input.candidateId;
  }

  if (store.swipe(job.id, candidateId, user.role)) throw new HttpError(409, 'You have already decided on this one');

  const isLike = input.decision === 'like';
  if (isLike && input.standout && standoutsRemaining(store, user) === 0) {
    throw new HttpError(429, 'You’ve used today’s Standout. More tomorrow!');
  }

  const swipe: Swipe = {
    id: Store.id(),
    jobId: job.id,
    candidateId,
    actor: user.role,
    decision: input.decision,
    standout: isLike && input.standout,
    likedSection: isLike ? input.likedSection || undefined : undefined,
    note: isLike ? input.note || undefined : undefined,
    createdAt: new Date().toISOString(),
  };
  store.data.swipes.push(swipe);

  let match: Match | null = null;
  const theirs = store.swipe(job.id, candidateId, user.role === 'candidate' ? 'employer' : 'candidate');
  if (isLike && theirs?.decision === 'like' && !store.matchFor(job.id, candidateId)) {
    match = {
      id: Store.id(),
      jobId: job.id,
      candidateId,
      employerId: job.employerId,
      status: 'active',
      createdAt: swipe.createdAt,
    };
    store.data.matches.push(match);
    // Comments left on likes open the conversation, as on Hinge.
    for (const like of [theirs, swipe]) {
      if (!like.note) continue;
      const senderId = like.actor === 'candidate' ? candidateId : job.employerId;
      const about = like.likedSection ? `Re: “${like.likedSection}” — ` : '';
      addMessageRaw(store, match.id, senderId, `${about}${like.note}`, like.createdAt);
    }
    addMessageRaw(store, match.id, null, `It’s a match for ${job.title}! Say hello and line up an interview.`);
  }

  store.save();
  return { swipe, match };
}

function addMessageRaw(store: Store, matchId: string, senderId: string | null, body: string, createdAt?: string): Message {
  const message: Message = { id: Store.id(), matchId, senderId, body, createdAt: createdAt ?? new Date().toISOString() };
  store.data.messages.push(message);
  return message;
}

function partyName(store: Store, match: Match, role: Role): string {
  return role === 'candidate'
    ? (store.candidate(match.candidateId)?.name ?? 'The candidate')
    : (store.employer(match.employerId)?.companyName ?? 'The employer');
}

function accessibleMatch(store: Store, user: StoredUser, matchId: string): Match {
  const match = store.match(matchId);
  const mine = match && (user.role === 'candidate' ? match.candidateId === user.id : match.employerId === user.id);
  if (!match || !mine || match.status !== 'active') throw new HttpError(404, 'Match not found');
  return match;
}

function summarise(store: Store, user: StoredUser, match: Match): MatchSummary {
  const messages = store.data.messages.filter((m) => m.matchId === match.id);
  const spoken = messages.filter((m) => m.senderId !== null);
  const lastMessage = messages.at(-1) ?? null;
  const lastSpoken = spoken.at(-1);
  return {
    match,
    job: store.job(match.jobId)!,
    employer: store.employer(match.employerId)!,
    candidate: store.candidate(match.candidateId)!,
    lastMessage,
    yourTurn: lastSpoken ? lastSpoken.senderId !== user.id : user.role === 'employer',
  };
}

export function matchSummaries(store: Store, user: StoredUser): MatchSummary[] {
  return store.data.matches
    .filter((m) => m.status === 'active' && (user.role === 'candidate' ? m.candidateId === user.id : m.employerId === user.id))
    .map((m) => summarise(store, user, m))
    .sort((a, b) => (b.lastMessage?.createdAt ?? b.match.createdAt).localeCompare(a.lastMessage?.createdAt ?? a.match.createdAt));
}

export function matchDetail(store: Store, user: StoredUser, matchId: string): MatchDetail {
  const match = accessibleMatch(store, user, matchId);
  const summary = summarise(store, user, match);
  return {
    ...summary,
    messages: store.data.messages.filter((m) => m.matchId === match.id),
    compatibility: computeMatch(summary.candidate, summary.job),
    theirLike: store.swipe(match.jobId, match.candidateId, user.role === 'candidate' ? 'employer' : 'candidate') ?? null,
  };
}

export function sendMessage(store: Store, user: StoredUser, matchId: string, body: string): Message {
  const match = accessibleMatch(store, user, matchId);
  const message = addMessageRaw(store, match.id, user.id, body);
  store.save();
  return message;
}

export function proposeInterview(store: Store, user: StoredUser, matchId: string, input: InterviewProposalInput): Match {
  const match = accessibleMatch(store, user, matchId);
  if (match.interview && ['proposed', 'scheduled'].includes(match.interview.status)) {
    throw new HttpError(409, 'There is already an interview in progress — cancel it first');
  }
  const now = Date.now();
  if (input.slots.some((s) => Date.parse(s) <= now)) throw new HttpError(400, 'slots: Times must be in the future');
  match.interview = {
    status: 'proposed',
    format: input.format,
    durationMinutes: input.durationMinutes,
    details: input.details,
    slots: [...new Set(input.slots)].sort(),
    proposedBy: user.role,
    updatedAt: new Date().toISOString(),
  };
  const count = match.interview.slots.length;
  addMessageRaw(
    store,
    match.id,
    null,
    `📅 ${partyName(store, match, user.role)} proposed a ${match.interview.durationMinutes}-minute ${INTERVIEW_FORMAT_LABELS[input.format].toLowerCase()} interview with ${count} time${count === 1 ? '' : 's'} to choose from.`,
  );
  store.save();
  return match;
}

function pendingInterviewFor(match: Match, user: StoredUser) {
  const interview = match.interview;
  if (!interview || interview.status !== 'proposed') throw new HttpError(409, 'There is no interview waiting on a reply');
  if (interview.proposedBy === user.role) throw new HttpError(403, 'The other side needs to reply to your proposal');
  return interview;
}

export function acceptInterview(store: Store, user: StoredUser, matchId: string, slot: string): Match {
  const match = accessibleMatch(store, user, matchId);
  const interview = pendingInterviewFor(match, user);
  const chosen = interview.slots.find((s) => Date.parse(s) === Date.parse(slot));
  if (!chosen) throw new HttpError(400, 'slot: Pick one of the offered times');
  interview.status = 'scheduled';
  interview.chosenSlot = chosen;
  interview.updatedAt = new Date().toISOString();
  addMessageRaw(store, match.id, null, `✅ Interview confirmed. Good luck, both of you!`);
  store.save();
  return match;
}

export function declineInterview(store: Store, user: StoredUser, matchId: string): Match {
  const match = accessibleMatch(store, user, matchId);
  const interview = pendingInterviewFor(match, user);
  interview.status = 'declined';
  interview.updatedAt = new Date().toISOString();
  addMessageRaw(store, match.id, null, `${partyName(store, match, user.role)} couldn’t make those times. Suggest some new ones?`);
  store.save();
  return match;
}

export function cancelInterview(store: Store, user: StoredUser, matchId: string): Match {
  const match = accessibleMatch(store, user, matchId);
  const interview = match.interview;
  if (!interview || !['proposed', 'scheduled'].includes(interview.status)) throw new HttpError(409, 'No interview to cancel');
  interview.status = 'cancelled';
  interview.updatedAt = new Date().toISOString();
  addMessageRaw(store, match.id, null, `${partyName(store, match, user.role)} cancelled the interview.`);
  store.save();
  return match;
}

export function unmatch(store: Store, user: StoredUser, matchId: string): void {
  const match = accessibleMatch(store, user, matchId);
  match.status = 'unmatched';
  match.unmatchedBy = user.role;
  store.save();
}

const upcoming = (match: Match) =>
  match.interview?.status === 'scheduled' && Date.parse(match.interview.chosenSlot!) > Date.now();

export function attentionSummary(store: Store, user: StoredUser): AttentionSummary {
  const matches = matchSummaries(store, user);
  return {
    likes: likesFor(store, user).length,
    yourTurn: matches.filter((m) => m.yourTurn).length,
    upcomingInterviews: matches.filter((m) => upcoming(m.match)).length,
  };
}

/** Per-role progress for an employer: who's left to review, who's keen, who's matched. */
export function jobPipeline(store: Store, employerId: string): JobPipeline[] {
  requireEmployer(store, employerId);
  const likes = likesFor(store, store.user(employerId)!);
  return store.data.jobs
    .filter((job) => job.employerId === employerId)
    .sort((a, b) => Number(b.active) - Number(a.active) || b.createdAt.localeCompare(a.createdAt))
    .map((job) => {
      const matches = store.data.matches.filter((m) => m.jobId === job.id && m.status === 'active');
      return {
        job,
        toReview: job.active ? employerFeed(store, employerId, job.id).length : 0,
        likedYou: likes.filter((l) => l.job.id === job.id).length,
        matches: matches.length,
        interviews: matches.filter(upcoming).length,
      };
    });
}
