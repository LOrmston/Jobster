import {
  COMPANY_SIZE_LABELS,
  formatSalary,
  JOB_TYPE_LABELS,
  normaliseSkill,
  SENIORITY_LABELS,
  WORK_MODE_LABELS,
  type EmployerProfile,
  type Job,
  type MatchResult,
} from '@jobster/shared';
import { CompanyLogo } from './Avatar';
import { MatchSummaryLine } from './MatchInsights';
import { PromptPanel, Section } from './Section';

interface Props {
  job: Job;
  employer: EmployerProfile;
  match?: MatchResult;
  onLike?: (label: string) => void;
}

/** A job advert laid out as a Hinge-style profile: the essentials first, then prompts to react to. */
export function JobProfile({ job, employer, match, onLike }: Props) {
  const matched = new Set((match?.matchedSkills ?? []).map(normaliseSkill));
  const skillChip = (skill: string) => (
    <li key={skill} className={`chip${matched.has(normaliseSkill(skill)) ? ' chip-match' : ''}`}>
      {skill}
    </li>
  );

  return (
    <div className="profile">
      <Section label="The role" onLike={onLike} className="panel-hero">
        <div className="hero-company">
          <CompanyLogo employer={employer} size={40} />
          <span>
            <strong>{employer.companyName}</strong>
            <span className="muted"> · {employer.industry}</span>
          </span>
        </div>
        <h2 className="hero-title">{job.title}</h2>
        <p className="facts">
          <strong>{formatSalary(job.salaryMin, job.salaryMax)}</strong> · {job.location} · {WORK_MODE_LABELS[job.workMode]} ·{' '}
          {JOB_TYPE_LABELS[job.jobType]} · {SENIORITY_LABELS[job.seniority]}
        </p>
        <p className="summary">{job.summary}</p>
        {match && <MatchSummaryLine match={match} />}
      </Section>

      {job.prompts[0] && <PromptPanel {...job.prompts[0]} onLike={onLike} />}

      <Section label="What you’ll bring" title="What you’ll bring" onLike={onLike}>
        <p className="muted small">{job.minYears > 0 ? `${job.minYears}+ years’ experience` : 'No minimum experience'}</p>
        <ul className="chips">{job.requiredSkills.map(skillChip)}</ul>
        {job.niceToHaveSkills.length > 0 && (
          <>
            <p className="muted small">Nice to have</p>
            <ul className="chips chips-soft">{job.niceToHaveSkills.map(skillChip)}</ul>
          </>
        )}
      </Section>

      {job.prompts.slice(1).map((p) => (
        <PromptPanel key={p.question} {...p} onLike={onLike} />
      ))}

      <Section label={`About ${employer.companyName}`} title={`About ${employer.companyName}`} onLike={onLike}>
        <p>{employer.about}</p>
        <p className="muted small">
          {COMPANY_SIZE_LABELS[employer.size]} · {employer.location}
        </p>
        {job.perks.length > 0 && (
          <ul className="chips chips-soft">
            {job.perks.map((perk) => (
              <li key={perk} className="chip">
                {perk}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
