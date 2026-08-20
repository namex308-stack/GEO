"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAppStore } from "@/lib/store";
import { PROFILE_UPDATED_EVENT } from "@/lib/auth/display-user";
import { withTimeout } from "@/lib/with-timeout";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthed: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const clearLocalSession = useAppStore((s) => s.clearLocalSession);

  React.useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    void withTimeout(
      supabase.auth.getSession().then((r) => r.data.session),
      4_000,
      null
    ).then((nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    const onProfileUpdated = () => {
      void supabase.auth.refreshSession().then(({ data }) => {
        if (!mounted) return;
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
        }
      });
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    };
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseBrowser();
    clearLocalSession();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAuthed: !!user,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
