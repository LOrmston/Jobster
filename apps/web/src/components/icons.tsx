import type { ReactNode } from 'react';

/** A small, consistent line-icon set (24px grid, 1.8 stroke) used instead of emoji. */
function Icon({ children, size = 22, filled = false }: { children: ReactNode; size?: number; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

type P = { size?: number; filled?: boolean };

export const HeartIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z" />
  </Icon>
);

export const CrossIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" strokeWidth="2.2" />
  </Icon>
);

export const StarIcon = (p: P) => (
  <Icon {...p} filled>
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </Icon>
);

export const CompassIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </Icon>
);

export const ChatIcon = (p: P) => (
  <Icon {...p}>
    <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l.9-4.1A8 8 0 1 1 20 12z" />
  </Icon>
);

export const BriefcaseIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2.5" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18" />
  </Icon>
);

export const PersonIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3" />
  </Icon>
);

export const BuildingIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 20V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V20M14 10h4.5A1.5 1.5 0 0 1 20 11.5V20M3 20h18M7.5 8h3M7.5 12h3M7.5 16h3" />
  </Icon>
);

export const PeopleIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="9" cy="8.5" r="3.3" />
    <path d="M3 19.5c.9-3 3.2-4.6 6-4.6s5.1 1.6 6 4.6M15.5 5.5a3.2 3.2 0 0 1 0 6.2M17.5 14.9c1.7.6 2.9 2 3.5 4.1" />
  </Icon>
);

export const CalendarIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Icon>
);

export const BackIcon = (p: P) => (
  <Icon {...p}>
    <path d="M15 5l-7 7 7 7" strokeWidth="2.2" />
  </Icon>
);
