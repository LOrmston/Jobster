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
import { MatchInsights } from './MatchInsights';
import { PromptPanel, Section } from './Section';

interface Props {
  candidate: CandidateProfile;
  match?: MatchResult;
  /** The job the employer is viewing this candidate for. */
  jobTitle?: string;
  onLike?: (label: string) => void;
}

export function CandidateProfileView({ candidate, match, jobTitle, onLike }: Props) {
  const matched = new Set((match?.matchedSkills ?? []).map(normaliseSkill));

  return (
    <div className="profile">
      <Section label="Their headline" onLike={onLike} className="panel-hero">
        <div className="hero-person">
          <CandidateAvatar candidate={candidate} size={88} />
          <div>
            <h2 className="hero-title">{candidate.name}</h2>
            <p className="summary">{candidate.headline}</p>
          </div>
        </div>
        <ul className="facts">
          <li>📍 {candidate.location}</li>
          <li>🧭 {candidate.yearsExperience} yrs</li>
          <li>📈 {SENIORITY_LABELS[candidate.seniority]}</li>
          <li>💷 {formatSalary(candidate.salaryMin)}</li>
          <li>🏠 {candidate.workModes.map((m) => WORK_MODE_LABELS[m]).join(' / ')}</li>
        </ul>
      </Section>

      {match && (
        <Section label="Why it’s a match" title={jobTitle ? `Fit for ${jobTitle}` : 'Why it’s a match'}>
          <MatchInsights match={match} />
        </Section>
      )}

      {candidate.prompts[0] && <PromptPanel {...candidate.prompts[0]} onLike={onLike} />}

      <Section label="Skills" title="Skills" onLike={onLike}>
        <ul className="chips">
          {candidate.skills.map((skill) => (
            <li key={skill} className={`chip${matched.has(normaliseSkill(skill)) ? ' chip-match' : ''}`}>
              {matched.has(normaliseSkill(skill)) && '✓ '}
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
        <ul className="chips chips-soft">
          {candidate.jobTypes.map((t) => (
            <li key={t} className="chip">
              {JOB_TYPE_LABELS[t]}
            </li>
          ))}
          {candidate.industries.map((i) => (
            <li key={i} className="chip">
              {i}
            </li>
          ))}
          {candidate.willingToRelocate && <li className="chip">Open to relocating</li>}
          <li className="chip">{candidate.rightToWork ? 'Right to work in the UK' : 'Needs sponsorship'}</li>
        </ul>
      </Section>
    </div>
  );
}
