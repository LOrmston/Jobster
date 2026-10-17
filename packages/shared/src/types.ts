export const ROLES = ['candidate', 'employer'] as const;
export type Role = (typeof ROLES)[number];

export const WORK_MODES = ['remote', 'hybrid', 'onsite'] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const SENIORITY_LEVELS = ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'] as const;
export type Seniority = (typeof SENIORITY_LEVELS)[number];

export const INTERVIEW_FORMATS = ['video', 'phone', 'in_person'] as const;
export type InterviewFormat = (typeof INTERVIEW_FORMATS)[number];

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-1000', '1000+'] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

/** A Hinge-style prompt: a question with a short, personal answer. */
export interface Prompt {
  question: string;
  answer: string;
}

export interface ExperienceItem {
  title: string;
  company: string;
  years: number;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface CandidateProfile {
  userId: string;
  name: string;
  headline: string;
  location: string;
  avatarColor: string;
  yearsExperience: number;
  seniority: Seniority;
  skills: string[];
  industries: string[];
  workModes: WorkMode[];
  jobTypes: JobType[];
  /** Minimum acceptable annual salary in GBP. */
  salaryMin: number;
  willingToRelocate: boolean;
  rightToWork: boolean;
  experience: ExperienceItem[];
  prompts: Prompt[];
  /** Preferences the candidate marked as non-negotiable: jobs failing them are hidden. */
  dealbreakers: {
    workMode: boolean;
    salary: boolean;
    jobType: boolean;
  };
}

export interface EmployerProfile {
  userId: string;
  companyName: string;
  tagline: string;
  about: string;
  industry: string;
  size: CompanySize;
  location: string;
  logoEmoji: string;
}

export interface Job {
  id: string;
  employerId: string;
  title: string;
  /** A succinct, two-or-three sentence pitch for the role. */
  summary: string;
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  salaryMin: number;
  salaryMax: number;
  seniority: Seniority;
  minYears: number;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  industry: string;
  perks: string[];
  prompts: Prompt[];
  /** Criteria the employer marked as non-negotiable: candidates failing them are hidden. */
  dealbreakers: {
    experience: boolean;
    rightToWork: boolean;
    /** Candidate must hold at least half of the required skills. */
    skills: boolean;
  };
  active: boolean;
  createdAt: string;
}

export type SwipeDecision = 'like' | 'pass';

/**
 * One side's decision about a (job, candidate) pair. A match exists when
 * both the candidate and the employer have liked the same pair.
 */
export interface Swipe {
  id: string;
  jobId: string;
  candidateId: string;
  actor: Role;
  decision: SwipeDecision;
  /** Hinge's "Rose": a limited, prioritised like. */
  standout: boolean;
  /** The section of the card that was liked, e.g. a prompt question. */
  likedSection?: string;
  note?: string;
  createdAt: string;
}

export type InterviewStatus = 'proposed' | 'scheduled' | 'declined' | 'cancelled';

export interface Interview {
  status: InterviewStatus;
  format: InterviewFormat;
  durationMinutes: number;
  /** Video link, phone number or address. */
  details: string;
  /** ISO timestamps offered by the proposer. */
  slots: string[];
  chosenSlot?: string;
  proposedBy: Role;
  updatedAt: string;
}

export interface Match {
  id: string;
  jobId: string;
  candidateId: string;
  employerId: string;
  status: 'active' | 'unmatched';
  unmatchedBy?: Role;
  interview?: Interview;
  createdAt: string;
}

export interface Message {
  id: string;
  matchId: string;
  /** Null for system messages, e.g. interview updates. */
  senderId: string | null;
  body: string;
  createdAt: string;
}
