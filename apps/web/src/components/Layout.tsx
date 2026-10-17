import { NavLink, Outlet } from 'react-router-dom';
import { useSession } from '../session';

const tabs = {
  candidate: [
    { to: '/', label: 'Discover', icon: '🧭' },
    { to: '/likes', label: 'Likes you', icon: '💜' },
    { to: '/matches', label: 'Matches', icon: '💬' },
    { to: '/profile', label: 'Profile', icon: '🙂' },
  ],
  employer: [
    { to: '/', label: 'Discover', icon: '🧭' },
    { to: '/likes', label: 'Likes you', icon: '💜' },
    { to: '/matches', label: 'Matches', icon: '💬' },
    { to: '/jobs', label: 'Jobs', icon: '📋' },
    { to: '/profile', label: 'Company', icon: '🏢' },
  ],
};

export function Layout() {
  const { user } = useSession();
  return (
    <div className="shell">
      <header className="topbar">
        <span className="wordmark">Jobster</span>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <nav className="tabbar" aria-label="Main">
        {tabs[user!.role].map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className={({ isActive }) => `tab${isActive ? ' tab-active' : ''}`}>
            <span className="tab-icon" aria-hidden>
              {tab.icon}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
