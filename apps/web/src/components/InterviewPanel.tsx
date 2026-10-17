import { useState } from 'react';
import {
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_FORMATS,
  interviewProposalSchema,
  type InterviewFormat,
  type Match,
  type MatchDetail,
  type Role,
} from '@jobster/shared';
import { api } from '../api';
import { formatSlot, interviewIcs, toLocalInput } from '../format';
import { errorToast } from '../toast';

interface Props {
  detail: MatchDetail;
  role: Role;
  onChange(match: Match): void;
}

const DETAILS_PLACEHOLDER: Record<InterviewFormat, string> = {
  video: 'Video link, e.g. https://meet.google.com/…',
  phone: 'Who calls whom, and on which number',
  in_person: 'Address and who to ask for',
};

function defaultSlots(): string[] {
  const at = (days: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return toLocalInput(d);
  };
  return [at(1, 10), at(2, 14), at(3, 11)];
}

/** The step that turns a match into a meeting: propose times, pick one, add it to your calendar. */
export function InterviewPanel({ detail, role, onChange }: Props) {
  const interview = detail.match.interview;
  const other = role === 'candidate' ? detail.employer.companyName : detail.candidate.name.split(' ')[0]!;
  const [proposing, setProposing] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<Match>) => {
    setBusy(true);
    try {
      onChange(await action());
      setProposing(false);
    } catch (err) {
      errorToast(err);
    } finally {
      setBusy(false);
    }
  };

  if (proposing) {
    return <ProposalForm busy={busy} onCancel={() => setProposing(false)} onSubmit={(input) => run(() => api.proposeInterview(detail.match.id, input))} />;
  }

  if (interview?.status === 'scheduled') {
    const download = () => {
      const url = URL.createObjectURL(new Blob([interviewIcs(interview, detail.job, other)], { type: 'text/calendar' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: 'jobster-interview.ics' });
      a.click();
      URL.revokeObjectURL(url);
    };
    return (
      <div className="interview interview-booked">
        <div className="interview-head">
          <span className="interview-emoji" aria-hidden>
            📅
          </span>
          <div>
            <strong>Interview booked</strong>
            <div>{formatSlot(interview.chosenSlot!)}</div>
            <div className="muted small">
              {interview.durationMinutes} min · {INTERVIEW_FORMAT_LABELS[interview.format]}
            </div>
          </div>
        </div>
        {interview.details && (
          <p className="interview-details">
            {/^https?:\/\//.test(interview.details) ? (
              <a href={interview.details} target="_blank" rel="noreferrer">
                {interview.details}
              </a>
            ) : (
              interview.details
            )}
          </p>
        )}
        <div className="row">
          <button type="button" className="btn btn-primary btn-small" onClick={download}>
            Add to calendar
          </button>
          <button type="button" className="btn btn-ghost btn-small" disabled={busy} onClick={() => run(() => api.cancelInterview(detail.match.id))}>
            Cancel interview
          </button>
        </div>
      </div>
    );
  }

  if (interview?.status === 'proposed') {
    const mine = interview.proposedBy === role;
    return (
      <div className="interview interview-pending">
        <strong>{mine ? `Waiting for ${other} to pick a time` : `${other} would like to interview — pick a time`}</strong>
        <div className="muted small">
          {interview.durationMinutes} min · {INTERVIEW_FORMAT_LABELS[interview.format]}
        </div>
        <div className="slots">
          {interview.slots.map((slot) =>
            mine ? (
              <span key={slot} className="slot slot-static">
                {formatSlot(slot)}
              </span>
            ) : (
              <button key={slot} type="button" className="slot" disabled={busy} onClick={() => run(() => api.acceptInterview(detail.match.id, slot))}>
                {formatSlot(slot)}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          disabled={busy}
          onClick={() => run(() => (mine ? api.cancelInterview(detail.match.id) : api.declineInterview(detail.match.id)))}
        >
          {mine ? 'Withdraw proposal' : 'None of these work'}
        </button>
      </div>
    );
  }

  return (
    <div className="interview interview-cta">
      <div>
        <strong>Ready to meet?</strong>
        <div className="muted small">Offer a few times and {other} picks the one that suits.</div>
      </div>
      <button type="button" className="btn btn-primary btn-small" onClick={() => setProposing(true)}>
        Propose interview
      </button>
    </div>
  );
}

function ProposalForm({ busy, onCancel, onSubmit }: { busy: boolean; onCancel(): void; onSubmit(input: ReturnType<typeof interviewProposalSchema.parse>): void }) {
  const [format, setFormat] = useState<InterviewFormat>('video');
  const [durationMinutes, setDuration] = useState(30);
  const [details, setDetails] = useState('');
  const [slots, setSlots] = useState(defaultSlots);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = slots.filter(Boolean).map((s) => new Date(s));
    if (chosen.some((d) => d.getTime() <= Date.now())) return setError('Pick times in the future');
    const parsed = interviewProposalSchema.safeParse({ format, durationMinutes, details, slots: chosen.map((d) => d.toISOString()) });
    if (!parsed.success) return setError(parsed.error.issues[0]!.message);
    setError(null);
    onSubmit(parsed.data);
  };

  return (
    <form className="interview interview-form" onSubmit={submit}>
      <strong>Propose an interview</strong>
      <div className="row">
        <label className="field grow">
          <span className="field-label">Format</span>
          <select value={format} onChange={(e) => setFormat(e.target.value as InterviewFormat)}>
            {INTERVIEW_FORMATS.map((f) => (
              <option key={f} value={f}>
                {INTERVIEW_FORMAT_LABELS[f]}
              </option>
            ))}
          </select>
        </label>
        <label className="field grow">
          <span className="field-label">Length</span>
          <select value={durationMinutes} onChange={(e) => setDuration(Number(e.target.value))}>
            {[15, 30, 45, 60, 90].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span className="field-label">Details</span>
        <input value={details} maxLength={300} placeholder={DETAILS_PLACEHOLDER[format]} onChange={(e) => setDetails(e.target.value)} />
      </label>
      <fieldset className="field">
        <legend className="field-label">Times you can do</legend>
        {slots.map((slot, i) => (
          <input
            key={i}
            type="datetime-local"
            value={slot}
            aria-label={`Option ${i + 1}`}
            onChange={(e) => setSlots(slots.map((s, j) => (j === i ? e.target.value : s)))}
          />
        ))}
      </fieldset>
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button type="submit" className="btn btn-primary btn-small" disabled={busy}>
          Send proposal
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
