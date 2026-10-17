import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CandidateProfile, EmployerProfile, User } from '@jobster/shared';
import { api, getToken, setToken, UNAUTHORISED_EVENT } from './api';

interface SessionState {
  status: 'loading' | 'signed-out' | 'signed-in';
  user: User | null;
  profile: CandidateProfile | EmployerProfile | null;
  standoutsRemaining: number;
}

interface SessionValue extends SessionState {
  signIn(token: string): Promise<void>;
  signOut(): Promise<void>;
  refresh(): Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

const signedOut: SessionState = { status: 'signed-out', user: null, profile: null, standoutsRemaining: 0 };

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ ...signedOut, status: getToken() ? 'loading' : 'signed-out' });

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setState(signedOut);
      return;
    }
    try {
      const me = await api.me();
      setState({ status: 'signed-in', user: me.user, profile: me.profile, standoutsRemaining: me.standoutsRemaining });
    } catch {
      setState(signedOut);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onUnauthorised = () => setState(signedOut);
    window.addEventListener(UNAUTHORISED_EVENT, onUnauthorised);
    return () => window.removeEventListener(UNAUTHORISED_EVENT, onUnauthorised);
  }, [refresh]);

  const value = useMemo<SessionValue>(
    () => ({
      ...state,
      refresh,
      async signIn(token) {
        setToken(token);
        await refresh();
      },
      async signOut() {
        await api.logout().catch(() => undefined);
        setToken(null);
        setState(signedOut);
      },
    }),
    [state, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

export function useCandidate(): CandidateProfile {
  return useSession().profile as CandidateProfile;
}

export function useEmployer(): EmployerProfile {
  return useSession().profile as EmployerProfile;
}
