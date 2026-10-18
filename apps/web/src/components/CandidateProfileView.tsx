import {
  formatSalary,
  JOB_TYPE_LABELS,
  normaliseSkill,
  SENIORITY_LABELS,
  WORK_MODE_LABELS,
  type CandidateProfile,
  type MatchResult,
} from '@jobster/shared';
import { CandidateAvatar } from './Avatar';
import { MatchSummaryLine } from './MatchInsights';
import { PromptPanel, Section } from './Section';

interface Props {
  candidate: CandidateProfile;
  match?: MatchResult;
  onLike?: (label: string) => void;
}

export function CandidateProfileView({ candidate, match, onLike }: Props) {
  const matched = new Set((match?.matchedSkills ?? []).map(normaliseSkill));

  return (
    <div className="profile">
      <Section label="Their headline" onLike={onLike} className="panel-hero">
        <div className="hero-person">
          <CandidateAvatar candidate={candidate} size={72} />
          <div>
            <h2 className="hero-title">{candidate.name}</h2>
            <p className="muted">{candidate.location}</p>
          </div>
        </div>
        <p className="summary">{candidate.headline}</p>
        <p className="facts">
          <strong>{candidate.yearsExperience} yrs</strong> · {SENIORITY_LABELS[candidate.seniority]} · {formatSalary(candidate.salaryMin)} ·{' '}
          {candidate.workModes.map((m) => WORK_MODE_LABELS[m]).join(' / ')}
        </p>
        {match && <MatchSummaryLine match={match} />}
      </Section>

      {candidate.prompts[0] && <PromptPanel {...candidate.prompts[0]} onLike={onLike} />}

      <Section label="Skills" title="Skills" onLike={onLike}>
        <ul className="chips">
          {candidate.skills.map((skill) => (
            <li key={skill} className={`chip${matched.has(normaliseSkill(skill)) ? ' chip-match' : ''}`}>
              {skill}
            </li>
          ))}
        </ul>
      </Section>

      {candidate.prompts.slice(1).map((p) => (
        <PromptPanel key={p.question} {...p} onLike={onLike} />
      ))}

      {candidate.experience.length > 0 && (
        <Section label="Experience" title="Experience" onLike={onLike}>
          <ul className="timeline">
            {candidate.experience.map((item) => (
              <li key={`${item.title}-${item.company}`}>
                <strong>{item.title}</strong>
                <span className="muted">
                  {' '}
                  · {item.company} · {item.years} yr{item.years === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section label="Looking for" title="Looking for">
        <p>
          {candidate.jobTypes.map((t) => JOB_TYPE_LABELS[t]).join(', ')}
          {candidate.industries.length > 0 && ` in ${candidate.industries.join(', ')}`}.
        </p>
        <p className="muted small">
          {candidate.rightToWork ? 'Has the right to work in the UK' : 'Needs visa sponsorship'}
          {candidate.willingToRelocate && ' · Open to relocating'}
        </p>
      </Section>
    </div>
  );
}
