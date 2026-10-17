import { useState, type ReactNode } from 'react';
import type { Prompt, ZodError } from '@jobster/shared';

export type Errors = Record<string, string>;

export function zodErrors(error: ZodError): Errors {
  const errors: Errors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    errors[key] ??= issue.message;
  }
  return errors;
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="error">{error}</span>}
    </label>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="form-section">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

/** Type a value and press Enter (or comma) to add it as a chip. */
export function ChipInput({ value, onChange, placeholder }: { value: string[]; onChange(next: string[]): void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const item = draft.trim().replace(/,$/, '');
    if (item && !value.some((v) => v.toLowerCase() === item.toLowerCase())) onChange([...value, item]);
    setDraft('');
  };
  return (
    <div className="chip-input">
      <ul className="chips">
        {value.map((item) => (
          <li key={item} className="chip chip-removable">
            {item}
            <button type="button" aria-label={`Remove ${item}`} onClick={() => onChange(value.filter((v) => v !== item))}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={add}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
      />
    </div>
  );
}

/** Pill toggles. With `multiple`, any number can be on; otherwise exactly one. */
export function PillGroup<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T[];
  onChange(next: T[]): void;
}) {
  return (
    <div className="pills" role="group">
      {options.map((option) => {
        const on = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            className={`pill${on ? ' pill-active' : ''}`}
            onClick={() => onChange(on ? value.filter((v) => v !== option) : [...value, option])}
          >
            {labels[option]}
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange(next: boolean): void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden />
      <span>
        {label}
        {hint && <span className="field-hint block">{hint}</span>}
      </span>
    </label>
  );
}

export function PromptsEditor({ value, onChange, questions }: { value: Prompt[]; onChange(next: Prompt[]): void; questions: string[] }) {
  const unused = questions.filter((q) => !value.some((p) => p.question === q));
  const update = (i: number, patch: Partial<Prompt>) => onChange(value.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <div className="prompts-editor">
      {value.map((prompt, i) => (
        <div key={i} className="prompt-edit">
          <select value={prompt.question} onChange={(e) => update(i, { question: e.target.value })}>
            {[prompt.question, ...unused].map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
          <textarea rows={2} maxLength={300} value={prompt.answer} placeholder="Your answer" onChange={(e) => update(i, { answer: e.target.value })} />
          <button type="button" className="link danger" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            Remove
          </button>
        </div>
      ))}
      {value.length < 3 && unused.length > 0 && (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => onChange([...value, { question: unused[0]!, answer: '' }])}>
          + Add a prompt
        </button>
      )}
    </div>
  );
}

export const numberValue = (raw: string) => (raw === '' ? 0 : Number(raw));
