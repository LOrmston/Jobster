import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useMatch, useSearchParams } from 'react-router-dom';
import type { MatchSummary } from '@jobster/shared';
import { api } from '../api';
import { CandidateAvatar, CompanyLogo } from '../components/Avatar';
import { CalendarIcon, ChatIcon } from '../components/icons';
import { formatSlot } from '../format';
import { useSession } from '../session';
import { errorToast } from '../toast';
import { Empty, RoleFilter } from './Discover';

const REFRESH_MS = 8000;

const isUpcoming = (s: MatchSummary) =>
  s.match.interview?.status === 'scheduled' && Date.parse(s.match.interview.chosenSlot!) > Date.now();

/** Matches as an inbox, grouped by what needs doing. On wide screens the open chat sits alongside. */
export function Matches() {
  const { user } = useSession();
  const role = user!.role;
  const { pathname } = useLocation();
  const open = useMatch('/matches/:id');
  const [items, setItems] = useState<MatchSummary[] | null>(null);
  const [params] = useSearchParams();
  const [roleId, setRoleId] = useState<string | null>(params.get('role'));

  useEffect(() => {
    const load = () => api.matches().then(setItems, errorToast);
    void load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [pathname]);

  const roles = useMemo(() => {
    const seen = new Map<string, { id: string; title: string }>();
    for (const s of items ?? []) seen.set(s.job.id, { id: s.job.id, title: s.job.title });
    return [...seen.values()];
  }, [items]);

  const visible = (items ?? []).filter((s) => roleId === null || s.job.id === roleId);
  const groups = [
    { title: 'Upcoming interviews', items: visible.filter(isUpcoming) },
    { title: 'Your turn', items: visible.filter((s) => !isUpcoming(s) && s.yourTurn) },
    { title: 'Waiting on them', items: visible.filter((s) => !isUpcoming(s) && !s.yourTurn) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className={`inbox${open ? ' inbox-chat-open' : ''}`}>
      <section className="inbox-list" aria-label="Matches">
        <h1 className="page-title">Matches</h1>
        {role === 'employer' && roles.length > 1 && <RoleFilter jobs={roles} value={roleId} onChange={setRoleId} label="Role" allowAll />}
        {!items ? (
          <p className="loading">Loading matches…</p>
        ) : visible.length === 0 ? (
          <Empty title="No matches yet">
            <p className="muted">When you and {role === 'candidate' ? 'an employer' : 'a candidate'} like each other, the conversation starts here.</p>
          </Empty>
        ) : (
          groups.map((group) => (
            <div key={group.title} className="inbox-group">
              <h2 className="group-title">
                {group.title} <span className="muted">{group.items.length}</span>
              </h2>
              <ul className="match-list">
                {group.items.map((s) => (
                  <li key={s.match.id}>
                    <MatchRow summary={s} role={role} />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
      <section className="inbox-chat">
        <Outlet />
      </section>
    </div>
  );
}

function MatchRow({ summary: s, role }: { summary: MatchSummary; role: 'candidate' | 'employer' }) {
  const name = role === 'candidate' ? s.employer.companyName : s.candidate.name;
  const interview = s.match.interview;
  return (
    <NavLink to={`/matches/${s.match.id}`} className={({ isActive }) => `match-row${isActive ? ' match-row-active' : ''}`}>
      {role === 'candidate' ? <CompanyLogo employer={s.employer} size={46} /> : <CandidateAvatar candidate={s.candidate} size={46} />}
      <span className="match-row-body">
        <span className="match-row-top">
          <strong>{name}</strong>
          {s.yourTurn && <span className="dot" aria-label="Your turn" />}
        </span>
        <span className="muted small block">{s.job.title}</span>
        {interview?.status === 'scheduled' ? (
          <span className="status status-booked">
            <CalendarIcon size={14} /> {formatSlot(interview.chosenSlot!)}
          </span>
        ) : interview?.status === 'proposed' ? (
          <span className="status status-pending">
            <CalendarIcon size={14} /> {interview.proposedBy === role ? 'Times sent' : 'Pick a time'}
          </span>
        ) : (
          <span className="match-row-last">{s.lastMessage?.body ?? 'Say hello'}</span>
        )}
      </span>
    </NavLink>
  );
}

/** Shown in the chat pane on wide screens before a conversation is picked. */
export function NoChatSelected() {
  return (
    <div className="no-chat">
      <ChatIcon size={40} />
      <p>Pick a conversation to chat and book interviews.</p>
    </div>
  );
}
