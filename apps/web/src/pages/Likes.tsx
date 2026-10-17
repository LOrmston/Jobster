import { useEffect, useState } from 'react';
import type { LikeItem, Match } from '@jobster/shared';
import { api } from '../api';
import { ActionBar } from '../components/ActionBar';
import { CandidateAvatar, CompanyLogo } from '../components/Avatar';
import { CandidateProfileView } from '../components/CandidateProfileView';
import { JobProfile } from '../components/JobProfile';
import { ScoreBadge } from '../components/MatchInsights';
import { MatchCelebration } from '../components/MatchCelebration';
import { Modal } from '../components/Modal';
import { StarIcon } from '../components/Section';
import { useSession } from '../session';
import { errorToast } from '../toast';

export function Likes() {
  const { user, standoutsRemaining, refresh } = useSession();
  const role = user!.role;
  const [items, setItems] = useState<LikeItem[] | null>(null);
  const [open, setOpen] = useState<LikeItem | null>(null);
  const [matched, setMatched] = useState<{ item: LikeItem; match: Match } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.likes().then(setItems, errorToast);
  }, []);

  const decide = async (item: LikeItem, decision: 'like' | 'pass', standout = false) => {
    setBusy(true);
    try {
      const res = await api.swipe({
        jobId: item.job.id,
        candidateId: role === 'employer' ? item.candidate.userId : undefined,
        decision,
        standout,
      });
      setItems((list) => list!.filter((i) => i.swipe.id !== item.swipe.id));
      setOpen(null);
      if (standout) void refresh();
      if (res.match) setMatched({ item, match: res.match });
    } catch (err) {
      errorToast(err);
    } finally {
      setBusy(false);
    }
  };

  if (!items) return <p className="loading">Loading likes…</p>;

  return (
    <div className="page">
      <h1 className="page-title">Likes you</h1>
      <p className="muted">
        {role === 'candidate' ? 'Employers who want to talk to you. Like them back to match.' : 'Candidates keen on your roles. Like them back to match.'}
      </p>
      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji" aria-hidden>
            💌
          </div>
          <h2>No likes yet</h2>
          <p className="muted">A complete profile with thoughtful prompts gets noticed. Keep swiping!</p>
        </div>
      ) : (
        <ul className="like-grid">
          {items.map((item) => (
            <li key={item.swipe.id}>
              <button type="button" className={`like-tile${item.swipe.standout ? ' like-tile-standout' : ''}`} onClick={() => setOpen(item)}>
                {item.swipe.standout && (
                  <span className="standout-tag">
                    <StarIcon /> Standout
                  </span>
                )}
                <span className="like-tile-head">
                  {role === 'candidate' ? <CompanyLogo employer={item.employer} size={40} /> : <CandidateAvatar candidate={item.candidate} size={40} />}
                  <span>
                    <strong>{role === 'candidate' ? item.employer.companyName : item.candidate.name}</strong>
                    <span className="muted small block">{item.job.title}</span>
                  </span>
                </span>
                {item.swipe.likedSection && <span className="like-tile-section">Liked “{item.swipe.likedSection}”</span>}
                {item.swipe.note && <span className="like-tile-note">“{item.swipe.note}”</span>}
                <ScoreBadge score={item.match.score} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <Modal variant="sheet" label="Profile" onClose={() => setOpen(null)}>
          {open.swipe.note && (
            <div className="their-note">
              <span className="muted small">{open.swipe.likedSection ? `Liked “${open.swipe.likedSection}”` : 'Liked you'}</span>
              <p>“{open.swipe.note}”</p>
            </div>
          )}
          <div className="sheet-scroll">
            {role === 'candidate' ? (
              <JobProfile job={open.job} employer={open.employer} match={open.match} />
            ) : (
              <CandidateProfileView candidate={open.candidate} match={open.match} jobTitle={open.job.title} />
            )}
          </div>
          <ActionBar
            disabled={busy}
            onPass={() => decide(open, 'pass')}
            onLike={() => decide(open, 'like')}
            onStandout={() => decide(open, 'like', true)}
            standoutsRemaining={standoutsRemaining}
            likeLabel="Match"
          />
        </Modal>
      )}

      {matched && (
        <MatchCelebration
          match={matched.match}
          job={matched.item.job}
          employer={matched.item.employer}
          candidate={matched.item.candidate}
          viewer={role}
          onClose={() => setMatched(null)}
        />
      )}
    </div>
  );
}
