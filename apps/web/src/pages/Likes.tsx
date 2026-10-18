import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { LikeItem, Match } from '@jobster/shared';
import { api } from '../api';
import { ActionBar } from '../components/ActionBar';
import { CandidateAvatar, CompanyLogo } from '../components/Avatar';
import { CandidateProfileView } from '../components/CandidateProfileView';
import { StarIcon } from '../components/icons';
import { JobProfile } from '../components/JobProfile';
import { ScoreBadge } from '../components/MatchInsights';
import { MatchCelebration } from '../components/MatchCelebration';
import { Modal } from '../components/Modal';
import { useSession } from '../session';
import { errorToast } from '../toast';
import { Empty, RoleFilter } from './Discover';

export function Likes() {
  const { user, standoutsRemaining, refresh } = useSession();
  const role = user!.role;
  const [items, setItems] = useState<LikeItem[] | null>(null);
  const [params] = useSearchParams();
  const [roleId, setRoleId] = useState<string | null>(params.get('role'));
  const [open, setOpen] = useState<LikeItem | null>(null);
  const [matched, setMatched] = useState<{ item: LikeItem; match: Match } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.likes().then(setItems, errorToast);
  }, []);

  // Employers sort likes by the role they're for.
  const roles = useMemo(() => {
    const seen = new Map<string, { id: string; title: string }>();
    for (const item of items ?? []) seen.set(item.job.id, { id: item.job.id, title: item.job.title });
    return [...seen.values()];
  }, [items]);
  const visible = (items ?? []).filter((i) => roleId === null || i.job.id === roleId);

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
      <header className="page-head">
        <h1 className="page-title">Likes you</h1>
        <p className="muted">
          {role === 'candidate' ? 'Employers who want to talk. Like them back to match instantly.' : 'Candidates keen on your roles. Like them back to match instantly.'}
        </p>
      </header>
      {role === 'employer' && roles.length > 1 && <RoleFilter jobs={roles} value={roleId} onChange={setRoleId} label="Role" allowAll />}
      {visible.length === 0 ? (
        <Empty title="No likes yet">
          <p className="muted">A complete profile with thoughtful prompts gets noticed. Keep swiping!</p>
        </Empty>
      ) : (
        <ul className="like-grid">
          {visible.map((item) => (
            <li key={item.swipe.id}>
              <button type="button" className={`like-tile${item.swipe.standout ? ' like-tile-standout' : ''}`} onClick={() => setOpen(item)}>
                <span className="like-tile-head">
                  {role === 'candidate' ? <CompanyLogo employer={item.employer} size={44} /> : <CandidateAvatar candidate={item.candidate} size={44} />}
                  <span className="like-tile-who">
                    <strong>{role === 'candidate' ? item.employer.companyName : item.candidate.name}</strong>
                    <span className="muted small block">{role === 'candidate' ? item.job.title : `For ${item.job.title}`}</span>
                  </span>
                  {item.swipe.standout && (
                    <span className="standout-tag" title="Standout">
                      <StarIcon size={14} /> Standout
                    </span>
                  )}
                </span>
                {item.swipe.note ? (
                  <span className="like-tile-note">
                    {item.swipe.likedSection && <span className="muted small block">On “{item.swipe.likedSection}”</span>}“{item.swipe.note}”
                  </span>
                ) : (
                  <span className="muted small">{item.swipe.likedSection ? `Liked “${item.swipe.likedSection}”` : 'Liked your profile'}</span>
                )}
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
              <span className="muted small">{open.swipe.likedSection ? `On “${open.swipe.likedSection}”` : 'Their note'}</span>
              <p>“{open.swipe.note}”</p>
            </div>
          )}
          <div className="sheet-scroll">
            {role === 'candidate' ? (
              <JobProfile job={open.job} employer={open.employer} match={open.match} />
            ) : (
              <CandidateProfileView candidate={open.candidate} match={open.match} />
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
