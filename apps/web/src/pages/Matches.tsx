import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MatchSummary } from '@jobster/shared';
import { api } from '../api';
import { CandidateAvatar, CompanyLogo } from '../components/Avatar';
import { useSession } from '../session';
import { errorToast } from '../toast';
import { formatSlot } from '../format';

function InterviewPill({ summary }: { summary: MatchSummary }) {
  const interview = summary.match.interview;
  if (interview?.status === 'scheduled') return <span className="status status-booked">📅 {formatSlot(interview.chosenSlot!)}</span>;
  if (interview?.status === 'proposed') return <span className="status status-pending">Interview proposed</span>;
  return null;
}

export function Matches() {
  const { user } = useSession();
  const [items, setItems] = useState<MatchSummary[] | null>(null);

  useEffect(() => {
    api.matches().then(setItems, errorToast);
  }, []);

  if (!items) return <p className="loading">Loading matches…</p>;

  return (
    <div className="page">
      <h1 className="page-title">Matches</h1>
      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji" aria-hidden>
            🤝
          </div>
          <h2>No matches yet</h2>
          <p className="muted">When you and {user!.role === 'candidate' ? 'an employer' : 'a candidate'} both like each other, you’ll find them here.</p>
        </div>
      ) : (
        <ul className="match-list">
          {items.map((s) => {
            const name = user!.role === 'candidate' ? s.employer.companyName : s.candidate.name;
            return (
              <li key={s.match.id}>
                <Link to={`/matches/${s.match.id}`} className="match-row">
                  {user!.role === 'candidate' ? <CompanyLogo employer={s.employer} size={52} /> : <CandidateAvatar candidate={s.candidate} size={52} />}
                  <span className="match-row-body">
                    <span className="match-row-top">
                      <strong>{name}</strong>
                      {s.yourTurn && <span className="your-turn">Your turn</span>}
                    </span>
                    <span className="muted small block">{s.job.title}</span>
                    <span className="match-row-last">{s.lastMessage?.body ?? 'Say hello 👋'}</span>
                    <InterviewPill summary={s} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
