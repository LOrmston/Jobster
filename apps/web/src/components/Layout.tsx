import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import type { AttentionSummary } from '@jobster/shared';
import { api } from '../api';
import { useSession } from '../session';
import { Brand } from './Brand';
import { BriefcaseIcon, BuildingIcon, ChatIcon, CompassIcon, HeartIcon, PeopleIcon, PersonIcon } from './icons';

interface Tab {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: keyof AttentionSummary;
}

// Employers think in roles, so their navigation leads with reviewing
// candidates and keeps each role's pipeline one tap away.
const tabs: Record<'candidate' | 'employer', Tab[]> = {
  candidate: [
    { to: '/', label: 'Discover', icon: <CompassIcon /> },
    { to: '/likes', label: 'Likes you', icon: <HeartIcon />, badge: 'likes' },
    { to: '/matches', label: 'Matches', icon: <ChatIcon />, badge: 'yourTurn' },
    { to: '/profile', label: 'Profile', icon: <PersonIcon /> },
  ],
  employer: [
    { to: '/', label: 'Candidates', icon: <PeopleIcon /> },
    { to: '/likes', label: 'Likes you', icon: <HeartIcon />, badge: 'likes' },
    { to: '/matches', label: 'Matches', icon: <ChatIcon />, badge: 'yourTurn' },
    { to: '/jobs', label: 'Roles', icon: <BriefcaseIcon /> },
    { to: '/profile', label: 'Company', icon: <BuildingIcon /> },
  ],
};

/** Counts for the navigation badges, refreshed whenever the page changes. */
function useAttention(): AttentionSummary | null {
  const { pathname } = useLocation();
  const [summary, setSummary] = useState<AttentionSummary | null>(null);
  useEffect(() => {
    api.summary().then(setSummary, () => undefined);
  }, [pathname]);
  return summary;
}

export function Layout() {
  const { user } = useSession();
  const attention = useAttention();
  const items = tabs[user!.role];

  const links = (variant: 'side' | 'tab') =>
    items.map((tab) => {
      const count = tab.badge && attention ? attention[tab.badge] : 0;
      return (
        <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => `${variant}${isActive ? ` ${variant}-active` : ''}`}>
          <span className={`${variant}-icon`}>
            {tab.icon}
            {count > 0 && <span className="badge">{count > 9 ? '9+' : count}</span>}
          </span>
          <span className={`${variant}-label`}>{tab.label}</span>
        </NavLink>
      );
    });

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand" aria-label="Jobster home">
          <Brand />
        </Link>
        <nav aria-label="Main" className="sidebar-nav">
          {links('side')}
        </nav>
        <p className="sidebar-foot">{user!.role === 'employer' ? 'Hiring on Jobster' : 'Swipe right on your next job'}</p>
      </aside>
      <header className="topbar">
        <Link to="/" aria-label="Jobster home">
          <Brand />
        </Link>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Main">
        {links('tab')}
      </nav>
    </div>
  );
}
