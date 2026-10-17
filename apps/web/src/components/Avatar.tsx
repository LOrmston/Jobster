import type { CandidateProfile, EmployerProfile } from '@jobster/shared';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

export function CandidateAvatar({ candidate, size = 48 }: { candidate: Pick<CandidateProfile, 'name' | 'avatarColor'>; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: candidate.avatarColor }} aria-hidden>
      {initials(candidate.name)}
    </span>
  );
}

export function CompanyLogo({ employer, size = 48 }: { employer: Pick<EmployerProfile, 'logoEmoji'>; size?: number }) {
  return (
    <span className="avatar avatar-logo" style={{ width: size, height: size, fontSize: size * 0.5 }} aria-hidden>
      {employer.logoEmoji}
    </span>
  );
}
