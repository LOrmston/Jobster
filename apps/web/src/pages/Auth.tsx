import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginSchema, registerSchema, type Role } from '@jobster/shared';
import { api } from '../api';
import { Brand, BrandLogo } from '../components/Brand';
import { BuildingIcon, PersonIcon } from '../components/icons';
import { useSession } from '../session';

export function Welcome() {
  return (
    <div className="welcome">
      <section className="welcome-hero">
        <BrandLogo className="welcome-logo" />
        <h1 className="welcome-title">Job hunting, without the hunting.</h1>
        <p className="welcome-lede">Short, honest job cards. A match score that explains itself. Like someone back and you’re straight into a chat and a booked interview.</p>
        <div className="welcome-actions">
          <Link to="/register?role=candidate" className="btn btn-primary btn-large">
            I’m looking for a job
          </Link>
          <Link to="/register?role=employer" className="btn btn-ghost btn-large">
            I’m hiring
          </Link>
        </div>
        <p className="muted">
          Already on Jobster? <Link to="/login">Sign in</Link>
        </p>
      </section>
      <section className="welcome-how" aria-label="How it works">
        <div className="how-card">
          <h2>For job seekers</h2>
          <ol>
            <li>Swipe through roles ranked by how well they fit you</li>
            <li>Like the part that caught your eye, and say why</li>
            <li>Match, chat and pick an interview slot</li>
          </ol>
        </div>
        <div className="how-card">
          <h2>For employers</h2>
          <ol>
            <li>Post a role in a few minutes, with your dealbreakers</li>
            <li>Review candidates who already fit, best first</li>
            <li>Match, then offer interview times in one tap</li>
          </ol>
        </div>
      </section>
    </div>
  );
}

function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="auth">
      <Link to="/" aria-label="Jobster home">
        <Brand />
      </Link>
      <h1 className="page-title">{title}</h1>
      {children}
    </div>
  );
}

export function Login() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0]!.message);
    setBusy(true);
    setError(null);
    try {
      const { token } = await api.login(parsed.data.email, parsed.data.password);
      await signIn(token);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Welcome back">
      <form className="form" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field-label">Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="demo-box">
        <strong>Try the demo</strong>
        <p className="small">
          Password <code>password123</code> for both:
        </p>
        <div className="row">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => (setEmail('candidate@jobster.dev'), setPassword('password123'))}>
            Job seeker
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => (setEmail('employer@jobster.dev'), setPassword('password123'))}>
            Employer
          </button>
        </div>
      </div>
      <p className="muted small">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </AuthCard>
  );
}

export function Register() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<Role>(params.get('role') === 'employer' ? 'employer' : 'candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ email, password, role });
    if (!parsed.success) return setError(parsed.error.issues[0]!.message);
    setBusy(true);
    setError(null);
    try {
      const { token } = await api.register(parsed.data.email, parsed.data.password, parsed.data.role);
      await signIn(token);
      navigate('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Create your account">
      <div className="role-picker" role="radiogroup" aria-label="I am">
        {(['candidate', 'employer'] as const).map((r) => (
          <button key={r} type="button" role="radio" aria-checked={role === r} className={`role-option${role === r ? ' role-option-active' : ''}`} onClick={() => setRole(r)}>
            <span className="role-icon">{r === 'candidate' ? <PersonIcon size={28} /> : <BuildingIcon size={28} />}</span>
            {r === 'candidate' ? 'Looking for a job' : 'Hiring'}
          </button>
        ))}
      </div>
      <form className="form" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field-label">{role === 'employer' ? 'Work email' : 'Email'}</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <span className="field-hint">At least 8 characters</span>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating…' : 'Continue'}
        </button>
      </form>
      <p className="muted small">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthCard>
  );
}
