import type { ReactNode } from 'react';
import { HeartIcon } from './icons';

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
