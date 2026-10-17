import { SENIORITY_LEVELS, type CandidateProfile, type Job } from './types';

/**
 * The Jobster compatibility algorithm.
 *
 * Every (candidate, job) pair gets a 0–100 score built from weighted factors,
 * plus a list of dealbreakers. Both sides set dealbreakers (a candidate's
 * "must be remote", an employer's "must have 5+ years"); a pair that trips
 * any of them is ineligible and never appears in either side's feed.
 *
 * The result is symmetrical, so the same numbers explain the match to the
 * candidate looking at a job and to the employer looking at the candidate.
 */

export interface MatchFactor {
  key: 'skills' | 'experience' | 'seniority' | 'location' | 'salary' | 'jobType';
  label: string;
  weight: number;
  /** 0–1 */
  score: number;
  detail: string;
}

export interface MatchResult {
  /** 0–100 */
  score: number;
  eligible: boolean;
  dealbreakers: string[];
  factors: MatchFactor[];
  /** Short, human-readable reasons the pair fits. */
  highlights: string[];
  /** Short, human-readable reasons the pair might not fit. */
  gaps: string[];
  /** The job's required and nice-to-have skills the candidate has, as the job spells them. */
  matchedSkills: string[];
}

export const FACTOR_WEIGHTS: Record<MatchFactor['key'], number> = {
  skills: 40,
  experience: 25,
  seniority: 10,
  location: 10,
  salary: 10,
  jobType: 5,
};

const SKILL_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  reactjs: 'react',
  node: 'nodejs',
  k8s: 'kubernetes',
  postgres: 'postgresql',
  golang: 'go',
  ml: 'machinelearning',
  ai: 'artificialintelligence',
  ux: 'uxdesign',
  ui: 'uidesign',
  gcp: 'googlecloud',
  aws: 'amazonwebservices',
};

/** Reduce a skill to a canonical key so "React.js", "reactjs" and "React" compare equal. */
export function normaliseSkill(skill: string): string {
  const key = skill.toLowerCase().trim().replace(/[\s._-]+/g, '');
  return SKILL_ALIASES[key] ?? key;
}

function sameLocation(a: string, b: string): boolean {
  const city = (s: string) => s.split(',')[0]!.trim().toLowerCase();
  return city(a) !== '' && city(a) === city(b);
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const formatK = (n: number) => `£${Math.round(n / 1000)}k`;

export function computeMatch(candidate: CandidateProfile, job: Job): MatchResult {
  const factors: MatchFactor[] = [];
  const highlights: string[] = [];
  const gaps: string[] = [];
  const dealbreakers: string[] = [];

  // Skills
  const have = new Set(candidate.skills.map(normaliseSkill));
  const matchedRequired = job.requiredSkills.filter((s) => have.has(normaliseSkill(s)));
  const missingRequired = job.requiredSkills.filter((s) => !have.has(normaliseSkill(s)));
  const matchedNice = job.niceToHaveSkills.filter((s) => have.has(normaliseSkill(s)));
  const requiredCoverage = job.requiredSkills.length ? matchedRequired.length / job.requiredSkills.length : 1;
  const niceCoverage = job.niceToHaveSkills.length ? matchedNice.length / job.niceToHaveSkills.length : 1;
  const skillsScore = job.niceToHaveSkills.length ? 0.8 * requiredCoverage + 0.2 * niceCoverage : requiredCoverage;
  factors.push({
    key: 'skills',
    label: 'Skills',
    weight: FACTOR_WEIGHTS.skills,
    score: skillsScore,
    detail: `${matchedRequired.length}/${job.requiredSkills.length} required, ${matchedNice.length}/${job.niceToHaveSkills.length} nice-to-have`,
  });
  if (matchedRequired.length) {
    highlights.push(`${matchedRequired.length} of ${job.requiredSkills.length} required skills: ${matchedRequired.join(', ')}`);
  }
  if (matchedNice.length) highlights.push(`Bonus skills: ${matchedNice.join(', ')}`);
  if (missingRequired.length) gaps.push(`Missing: ${missingRequired.join(', ')}`);
  if (job.dealbreakers.skills && requiredCoverage < 0.5) {
    dealbreakers.push('Has fewer than half of the required skills');
  }

  // Experience
  const years = candidate.yearsExperience;
  const experienceScore = years >= job.minYears ? 1 : job.minYears > 0 ? clamp01(years / job.minYears) : 1;
  factors.push({
    key: 'experience',
    label: 'Experience',
    weight: FACTOR_WEIGHTS.experience,
    score: experienceScore,
    detail: `${years} yrs (${job.minYears}+ wanted)`,
  });
  if (years >= job.minYears) {
    highlights.push(`${years} yrs experience (${job.minYears}+ wanted)`);
  } else {
    gaps.push(`${job.minYears - years} yr${job.minYears - years === 1 ? '' : 's'} short of the ${job.minYears}+ wanted`);
    if (job.dealbreakers.experience) dealbreakers.push(`Needs ${job.minYears}+ years of experience`);
  }

  // Seniority
  const levelGap = Math.abs(SENIORITY_LEVELS.indexOf(candidate.seniority) - SENIORITY_LEVELS.indexOf(job.seniority));
  const seniorityScore = [1, 0.6, 0.25, 0][Math.min(levelGap, 3)]!;
  factors.push({
    key: 'seniority',
    label: 'Level',
    weight: FACTOR_WEIGHTS.seniority,
    score: seniorityScore,
    detail: levelGap === 0 ? 'Same level' : `${levelGap} level${levelGap === 1 ? '' : 's'} apart`,
  });
  if (levelGap === 0) highlights.push('Right level for the role');
  else if (levelGap >= 2) gaps.push('Seniority is a stretch');

  // Location and work mode
  const modeOk = candidate.workModes.includes(job.workMode);
  const locationOk = job.workMode === 'remote' || sameLocation(candidate.location, job.location) || candidate.willingToRelocate;
  const locationScore = modeOk ? (locationOk ? 1 : 0.4) : locationOk ? 0.2 : 0;
  factors.push({
    key: 'location',
    label: 'Location',
    weight: FACTOR_WEIGHTS.location,
    score: locationScore,
    detail: `${job.workMode} in ${job.location}`,
  });
  if (modeOk && locationOk) highlights.push(job.workMode === 'remote' ? 'Remote suits both sides' : `Works for ${job.workMode} in ${job.location}`);
  if (!modeOk) {
    gaps.push(`Role is ${job.workMode}`);
    if (candidate.dealbreakers.workMode) dealbreakers.push(`Not open to ${job.workMode} work`);
  } else if (!locationOk) {
    gaps.push(`Based outside ${job.location}`);
  }

  // Salary
  const salaryOk = job.salaryMax >= candidate.salaryMin;
  const salaryScore = salaryOk ? 1 : clamp01(1 - ((candidate.salaryMin - job.salaryMax) / candidate.salaryMin) * 2);
  factors.push({
    key: 'salary',
    label: 'Salary',
    weight: FACTOR_WEIGHTS.salary,
    score: salaryScore,
    detail: `${formatK(job.salaryMin)}–${formatK(job.salaryMax)} vs ${formatK(candidate.salaryMin)}+`,
  });
  if (salaryOk) highlights.push('Salary expectations align');
  else {
    gaps.push(`Pays up to ${formatK(job.salaryMax)}, expectation is ${formatK(candidate.salaryMin)}+`);
    if (candidate.dealbreakers.salary) dealbreakers.push('Salary is below expectation');
  }

  // Job type
  const typeOk = candidate.jobTypes.includes(job.jobType);
  factors.push({
    key: 'jobType',
    label: 'Contract',
    weight: FACTOR_WEIGHTS.jobType,
    score: typeOk ? 1 : 0,
    detail: job.jobType,
  });
  if (!typeOk) {
    gaps.push('Contract type differs');
    if (candidate.dealbreakers.jobType) dealbreakers.push('Not the contract type wanted');
  }

  // Right to work
  if (!candidate.rightToWork) {
    gaps.push('Needs visa sponsorship');
    if (job.dealbreakers.rightToWork) dealbreakers.push('Requires existing right to work');
  }

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = Math.round((factors.reduce((sum, f) => sum + f.weight * f.score, 0) / totalWeight) * 100);

  return {
    score,
    eligible: dealbreakers.length === 0,
    dealbreakers,
    factors,
    highlights,
    gaps,
    matchedSkills: [...matchedRequired, ...matchedNice],
  };
}
