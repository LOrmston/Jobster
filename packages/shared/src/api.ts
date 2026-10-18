import type { MatchResult } from './matching';
import type { CandidateProfile, EmployerProfile, Interview, Job, Match, Message, Role, Swipe, User } from './types';

/** Response shapes for the REST API, shared by the web app and future mobile clients. */

export interface AuthResponse {
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
  profile: CandidateProfile | EmployerProfile | null;
}

export interface JobFeedItem {
  job: Job;
  employer: EmployerProfile;
  match: MatchResult;
}

export interface CandidateFeedItem {
  candidate: CandidateProfile;
  job: Job;
  match: MatchResult;
}

export type FeedItem = JobFeedItem | CandidateFeedItem;

/** Someone who liked you and is waiting for your decision. */
export interface LikeItem {
  swipe: Swipe;
  job: Job;
  employer: EmployerProfile;
  candidate: CandidateProfile;
  match: MatchResult;
}

export interface SwipeResponse {
  swipe: Swipe;
  match: Match | null;
}

export interface MatchSummary {
  match: Match;
  job: Job;
  employer: EmployerProfile;
  candidate: CandidateProfile;
  lastMessage: Message | null;
  /** True when the other side spoke last, Hinge's "Your turn". */
  yourTurn: boolean;
}

export interface MatchDetail extends MatchSummary {
  messages: Message[];
  compatibility: MatchResult;
  /** The swipe that the other side sent, if they liked a specific section. */
  theirLike: Swipe | null;
}

export type { Interview, Role };

/** What needs the viewer's attention, for navigation badges. */
export interface AttentionSummary {
  /** People who liked you and are waiting on your decision. */
  likes: number;
  /** Matches where the other side spoke last. */
  yourTurn: number;
  /** Interviews booked for the future. */
  upcomingInterviews: number;
}

/** How hiring is going for one of an employer's roles. */
export interface JobPipeline {
  job: Job;
  toReview: number;
  likedYou: number;
  matches: number;
  interviews: number;
}
