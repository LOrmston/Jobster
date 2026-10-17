import type { ReactNode } from 'react';

interface Props {
  /** Used as the "liked section" label when someone hearts this part of a profile. */
  label: string;
  title?: string;
  onLike?: (label: string) => void;
  className?: string;
  children: ReactNode;
}

/** A Hinge-style profile panel. Each one can be liked on its own, with a comment. */
export function Section({ label, title, onLike, className = '', children }: Props) {
  return (
    <section className={`panel ${className}`}>
      {title && <h3 className="panel-title">{title}</h3>}
      {children}
      {onLike && (
        <button type="button" className="panel-like" onClick={() => onLike(label)} aria-label={`Like “${label}”`}>
          <HeartIcon />
        </button>
      )}
    </section>
  );
}

export function PromptPanel({ question, answer, onLike }: { question: string; answer: string; onLike?: (label: string) => void }) {
  return (
    <Section label={question} onLike={onLike} className="panel-prompt">
      <p className="prompt-q">{question}</p>
      <p className="prompt-a">{answer}</p>
    </Section>
  );
}

export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
