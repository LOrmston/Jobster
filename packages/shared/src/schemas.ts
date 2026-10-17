import { z } from 'zod';
import { COMPANY_SIZES, INTERVIEW_FORMATS, JOB_TYPES, ROLES, SENIORITY_LEVELS, WORK_MODES } from './types';

const trimmed = (max: number) => z.string().trim().max(max);
const required = (max: number) => trimmed(max).min(1, 'Required');
const salary = z.number().int().min(0).max(10_000_000);

const promptSchema = z.object({
  question: required(120),
  answer: required(300),
});

const skillList = z.array(required(40)).max(30);

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters').max(200),
  role: z.enum(ROLES),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Required'),
});

export const candidateProfileSchema = z.object({
  name: required(80),
  headline: required(120),
  location: required(80),
  avatarColor: z.string().regex(/^#[0-9a-f]{6}$/i).default('#6c3ce0'),
  yearsExperience: z.number().int().min(0).max(60),
  seniority: z.enum(SENIORITY_LEVELS),
  skills: skillList.min(1, 'Add at least one skill'),
  industries: z.array(required(40)).max(10),
  workModes: z.array(z.enum(WORK_MODES)).min(1, 'Pick at least one'),
  jobTypes: z.array(z.enum(JOB_TYPES)).min(1, 'Pick at least one'),
  salaryMin: salary,
  willingToRelocate: z.boolean(),
  rightToWork: z.boolean(),
  experience: z
    .array(z.object({ title: required(80), company: required(80), years: z.number().min(0).max(60) }))
    .max(10),
  prompts: z.array(promptSchema).max(3),
  dealbreakers: z.object({ workMode: z.boolean(), salary: z.boolean(), jobType: z.boolean() }),
});

export const employerProfileSchema = z.object({
  companyName: required(80),
  tagline: required(120),
  about: required(1000),
  industry: required(60),
  size: z.enum(COMPANY_SIZES),
  location: required(80),
  logoEmoji: required(8),
});

export const jobSchema = z
  .object({
    title: required(100),
    summary: required(400),
    location: required(80),
    workMode: z.enum(WORK_MODES),
    jobType: z.enum(JOB_TYPES),
    salaryMin: salary,
    salaryMax: salary,
    seniority: z.enum(SENIORITY_LEVELS),
    minYears: z.number().int().min(0).max(40),
    requiredSkills: skillList.min(1, 'Add at least one required skill'),
    niceToHaveSkills: skillList,
    industry: required(60),
    perks: z.array(required(60)).max(10),
    prompts: z.array(promptSchema).max(3),
    dealbreakers: z.object({ experience: z.boolean(), rightToWork: z.boolean(), skills: z.boolean() }),
    active: z.boolean().default(true),
  })
  .refine((j) => j.salaryMax >= j.salaryMin, { message: 'Maximum salary must be at least the minimum', path: ['salaryMax'] });

export const swipeSchema = z.object({
  jobId: z.string().min(1),
  /** Required when an employer swipes; ignored for candidates (it is always them). */
  candidateId: z.string().min(1).optional(),
  decision: z.enum(['like', 'pass']),
  standout: z.boolean().default(false),
  likedSection: trimmed(120).optional(),
  note: trimmed(300).optional(),
});

export const messageSchema = z.object({
  body: required(2000),
});

export const interviewProposalSchema = z.object({
  format: z.enum(INTERVIEW_FORMATS),
  durationMinutes: z.number().int().min(15).max(480),
  details: trimmed(300),
  slots: z.array(z.string().datetime({ offset: true })).min(1, 'Offer at least one time').max(5),
});

export const interviewAcceptSchema = z.object({
  slot: z.string().datetime({ offset: true }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;
export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;
export type JobInput = z.infer<typeof jobSchema>;
export type SwipeInput = z.input<typeof swipeSchema>;
export type SwipeData = z.infer<typeof swipeSchema>;
export type InterviewProposalInput = z.infer<typeof interviewProposalSchema>;
