import type { CompanySize, InterviewFormat, JobType, Seniority, WorkMode } from './types';

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

export const SENIORITY_LABELS: Record<Seniority, string> = {
  entry: 'Entry level',
  junior: 'Junior',
  mid: 'Mid-level',
  senior: 'Senior',
  lead: 'Lead',
  executive: 'Executive',
};

export const INTERVIEW_FORMAT_LABELS: Record<InterviewFormat, string> = {
  video: 'Video call',
  phone: 'Phone call',
  in_person: 'In person',
};

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  '1-10': '1–10 people',
  '11-50': '11–50 people',
  '51-200': '51–200 people',
  '201-1000': '201–1,000 people',
  '1000+': '1,000+ people',
};

export const CANDIDATE_PROMPTS = [
  'My proudest work achievement is…',
  'I do my best work when…',
  'A skill I’m currently learning…',
  'My ideal team…',
  'You should hire me because…',
  'The way to win me over is…',
  'A problem I love solving…',
];

export const JOB_PROMPTS = [
  'A typical day looks like…',
  'We’re looking for someone who…',
  'The team you’d join…',
  'In your first 90 days you’ll…',
  'Why people stay…',
  'You’ll love it here if…',
];

export function formatSalary(min: number, max?: number): string {
  const k = (n: number) => `£${Math.round(n / 1000)}k`;
  if (max === undefined) return `${k(min)}+`;
  return min === max ? k(min) : `${k(min)}–${k(max)}`;
}
