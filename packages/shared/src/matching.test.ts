import { describe, expect, it } from 'vitest';
import { computeMatch, normaliseSkill } from './matching';
import type { CandidateProfile, Job } from './types';

const candidate = (overrides: Partial<CandidateProfile> = {}): CandidateProfile => ({
  userId: 'c1',
  name: 'Ada',
  headline: 'Frontend engineer',
  location: 'London, UK',
  avatarColor: '#6c3ce0',
  yearsExperience: 6,
  seniority: 'senior',
  skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
  industries: ['Fintech'],
  workModes: ['remote', 'hybrid'],
  jobTypes: ['full_time'],
  salaryMin: 70000,
  willingToRelocate: false,
  rightToWork: true,
  experience: [],
  prompts: [],
  dealbreakers: { workMode: false, salary: false, jobType: false },
  ...overrides,
});

const job = (overrides: Partial<Job> = {}): Job => ({
  id: 'j1',
  employerId: 'e1',
  title: 'Senior Frontend Engineer',
  summary: 'Build things.',
  location: 'London',
  workMode: 'hybrid',
  jobType: 'full_time',
  salaryMin: 70000,
  salaryMax: 90000,
  seniority: 'senior',
  minYears: 5,
  requiredSkills: ['React', 'TypeScript'],
  niceToHaveSkills: ['GraphQL'],
  industry: 'Fintech',
  perks: [],
  prompts: [],
  dealbreakers: { experience: false, rightToWork: false, skills: false },
  active: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('normaliseSkill', () => {
  it('treats spelling variants and aliases as the same skill', () => {
    expect(normaliseSkill('React.js')).toBe(normaliseSkill('react'));
    expect(normaliseSkill('Node.js')).toBe(normaliseSkill('node'));
    expect(normaliseSkill('JS')).toBe(normaliseSkill('JavaScript'));
    expect(normaliseSkill('Postgres')).toBe(normaliseSkill('PostgreSQL'));
  });
});

describe('computeMatch', () => {
  it('scores a perfect fit at 100 and lists why', () => {
    const result = computeMatch(candidate(), job());
    expect(result.score).toBe(100);
    expect(result.eligible).toBe(true);
    expect(result.matchedSkills).toEqual(['React', 'TypeScript', 'GraphQL']);
    expect(result.gaps).toEqual([]);
  });

  it('lowers the score for missing skills and experience', () => {
    const weaker = computeMatch(candidate({ skills: ['React'], yearsExperience: 2, seniority: 'mid' }), job());
    expect(weaker.score).toBeLessThan(70);
    expect(weaker.gaps).toContain('Missing: TypeScript');
    expect(weaker.eligible).toBe(true);
  });

  it('ranks stronger candidates above weaker ones', () => {
    const strong = computeMatch(candidate(), job());
    const medium = computeMatch(candidate({ yearsExperience: 4 }), job());
    const weak = computeMatch(candidate({ skills: ['Python'], yearsExperience: 1, seniority: 'junior' }), job());
    expect(strong.score).toBeGreaterThan(medium.score);
    expect(medium.score).toBeGreaterThan(weak.score);
  });

  it('applies candidate dealbreakers', () => {
    const onsite = job({ workMode: 'onsite' });
    expect(computeMatch(candidate(), onsite).eligible).toBe(true);
    const result = computeMatch(candidate({ dealbreakers: { workMode: true, salary: false, jobType: false } }), onsite);
    expect(result.eligible).toBe(false);
    expect(result.dealbreakers).toEqual(['Not open to onsite work']);

    const lowPay = job({ salaryMin: 40000, salaryMax: 50000 });
    expect(computeMatch(candidate({ dealbreakers: { workMode: false, salary: true, jobType: false } }), lowPay).eligible).toBe(false);
  });

  it('applies employer dealbreakers', () => {
    const strict = job({ dealbreakers: { experience: true, rightToWork: true, skills: true } });
    expect(computeMatch(candidate(), strict).eligible).toBe(true);
    expect(computeMatch(candidate({ yearsExperience: 3 }), strict).eligible).toBe(false);
    expect(computeMatch(candidate({ rightToWork: false }), strict).eligible).toBe(false);
    expect(computeMatch(candidate({ skills: ['Python'] }), strict).eligible).toBe(false);
  });

  it('accepts remote roles regardless of location and on-site roles in the same city', () => {
    const elsewhere = candidate({ location: 'Leeds, UK', workModes: ['remote', 'onsite'] });
    const remote = computeMatch(elsewhere, job({ workMode: 'remote', location: 'London' }));
    const onsite = computeMatch(elsewhere, job({ workMode: 'onsite', location: 'London' }));
    expect(remote.factors.find((f) => f.key === 'location')!.score).toBe(1);
    expect(onsite.factors.find((f) => f.key === 'location')!.score).toBeLessThan(1);
    const relocator = computeMatch({ ...elsewhere, willingToRelocate: true }, job({ workMode: 'onsite', location: 'London' }));
    expect(relocator.factors.find((f) => f.key === 'location')!.score).toBe(1);
  });
});
