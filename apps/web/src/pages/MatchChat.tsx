import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { MatchDetail } from '@jobster/shared';
import { api } from '../api';
import { CandidateAvatar, CompanyLogo } from '../components/Avatar';
import { BackIcon } from '../components/icons';
import { CandidateProfileView } from '../components/CandidateProfileView';
import { InterviewPanel } from '../components/InterviewPanel';
import { JobProfile } from '../components/JobProfile';
import { Modal } from '../components/Modal';
import { formatTime } from '../format';
import { useSession } from '../session';
import { errorToast, toast } from '../toast';

const POLL_MS = 4000;

/** Remount per conversation so drafts and scroll position don't leak between chats. */
export function MatchChatRoute() {
  const { id } = useParams<{ id: string }>();
  return <MatchChat key={id} />;
}

export function MatchChat() {
  const { id } = useParams<{ id: string }>();
  const { user } = useSession();
  const role = user!.role;
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MatchDetail | null>(null);
  const [draft, setDraft] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api.match(id!).then(setDetail, (err) => {
      errorToast(err);
      navigate('/matches');
    });
  }, [id, navigate]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const count = detail?.messages.length;
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [count]);

  if (!detail) return <p className="loading">Opening chat…</p>;

  const otherName = role === 'candidate' ? detail.employer.companyName : detail.candidate.name;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      await api.sendMessage(detail.match.id, body);
      setDraft('');
      load();
    } catch (err) {
      errorToast(err);
    } finally {
      setSending(false);
    }
  };

  const unmatch = async () => {
    if (!window.confirm(`Unmatch from ${otherName}? You won’t be able to message each other again.`)) return;
    try {
      await api.unmatch(detail.match.id);
      toast(`Unmatched from ${otherName}`);
      navigate('/matches');
    } catch (err) {
      errorToast(err);
    }
  };

  return (
    <div className="chat">
      <header className="chat-head">
        <Link to="/matches" className="back" aria-label="Back to matches">
          <BackIcon />
        </Link>
        <button type="button" className="chat-who" onClick={() => setShowProfile(true)}>
          {role === 'candidate' ? <CompanyLogo employer={detail.employer} size={40} /> : <CandidateAvatar candidate={detail.candidate} size={40} />}
          <span>
            <strong>{otherName}</strong>
            <span className="muted small block">
              {detail.job.title} · {detail.compatibility.score}% match
            </span>
          </span>
        </button>
        <button type="button" className="btn btn-ghost btn-small" onClick={() => setShowProfile(true)}>
          Profile
        </button>
        <button type="button" className="link muted small" onClick={unmatch}>
          Unmatch
        </button>
      </header>

      <InterviewPanel detail={detail} role={role} onChange={() => load()} />

      <div className="messages" aria-live="polite">
        {detail.messages.map((m) =>
          m.senderId === null ? (
            <p key={m.id} className="msg-system">
              {m.body}
            </p>
          ) : (
            <div key={m.id} className={`msg ${m.senderId === user!.id ? 'msg-mine' : 'msg-theirs'}`}>
              <p>{m.body}</p>
              <time dateTime={m.createdAt}>{formatTime(m.createdAt)}</time>
            </div>
          ),
        )}
        <div ref={bottom} />
      </div>

      <form className="composer" onSubmit={send}>
        <input value={draft} maxLength={2000} placeholder={`Message ${otherName}`} onChange={(e) => setDraft(e.target.value)} aria-label="Message" />
        <button type="submit" className="btn btn-primary btn-small" disabled={sending || !draft.trim()}>
          Send
        </button>
      </form>

      {showProfile && (
        <Modal variant="sheet" label={otherName} onClose={() => setShowProfile(false)}>
          <div className="sheet-scroll">
            {role === 'candidate' ? (
              <JobProfile job={detail.job} employer={detail.employer} match={detail.compatibility} />
            ) : (
              <CandidateProfileView candidate={detail.candidate} match={detail.compatibility} />
            )}
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => setShowProfile(false)}>
            Close
          </button>
        </Modal>
      )}
    </div>
  );
}
