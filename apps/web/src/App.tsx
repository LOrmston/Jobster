import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login, Register, Welcome } from './pages/Auth';
import { Discover } from './pages/Discover';
import { JobEditor, Jobs } from './pages/Jobs';
import { Likes } from './pages/Likes';
import { MatchChatRoute } from './pages/MatchChat';
import { Matches, NoChatSelected } from './pages/Matches';
import { Onboarding } from './pages/Onboarding';
import { Profile } from './pages/Profile';
import { useSession } from './session';

export function App() {
  const { status, user, profile } = useSession();

  if (status === 'loading') return <p className="loading">Loading…</p>;

  if (status === 'signed-out') {
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (!profile) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Discover />} />
        <Route path="likes" element={<Likes />} />
        <Route path="matches" element={<Matches />}>
          <Route index element={<NoChatSelected />} />
          <Route path=":id" element={<MatchChatRoute />} />
        </Route>
        <Route path="profile" element={<Profile />} />
        {user!.role === 'employer' && (
          <>
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/new" element={<JobEditor />} />
            <Route path="jobs/:id" element={<JobEditor key="edit" />} />
          </>
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
