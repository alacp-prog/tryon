import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isSupabaseConfigured } from '@/lib/supabase';
import { fetchIsAdmin, getCurrentSession, onSessionChange } from '@/services/auth';

interface AuthState {
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, isAdmin: false, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    isAdmin: false,
    isLoading: isSupabaseConfigured,
  });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let isMounted = true;

    const applySession = async (session: Session | null) => {
      const isAdmin = session ? await fetchIsAdmin() : false;
      if (isMounted) setState({ session, isAdmin, isLoading: false });
    };

    getCurrentSession().then(applySession);
    // Supabase deadlocks if its client is called inside the auth callback: defer the RPC.
    const unsubscribe = onSessionChange((session) => {
      setTimeout(() => applySession(session), 0);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
