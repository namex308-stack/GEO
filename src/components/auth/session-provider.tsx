"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface SessionContext {
  user: User | null;
  loading: boolean;
}

const SessionCtx = React.createContext<SessionContext>({ user: null, loading: true });

export function useSession() {
  return React.useContext(SessionCtx);
}

export function SessionProvider({
  serverUser,
  children,
}: {
  serverUser: User | null;
  children: React.ReactNode;
}) {
  const sb = React.useMemo(() => getSupabaseBrowser(), []);
  const [user, setUser] = React.useState<User | null>(serverUser);
  const [loading, setLoading] = React.useState(!serverUser && !!sb);

  // Sync server-provided user when the prop changes (React render-time adjustment).
  const [prevServerUser, setPrevServerUser] = React.useState(serverUser);
  if (serverUser !== prevServerUser) {
    setPrevServerUser(serverUser);
    setUser(serverUser);
    setLoading(false);
  }

  React.useEffect(() => {
    if (!sb) return;

    let cancelled = false;
    sb.auth
      .getUser()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error || !data.user) {
          // Drop unusable local session (e.g. refresh_token_not_found) so
          // subsequent navigations do not keep hitting AuthApiError.
          if (error) {
            try {
              await sb.auth.signOut({ scope: "local" });
            } catch {
              /* ignore */
            }
          }
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(data.user);
        setLoading(false);
      })
      .catch(async () => {
        try {
          await sb.auth.signOut({ scope: "local" });
        } catch {
          /* ignore */
        }
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
      });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [sb]);

  const value = React.useMemo<SessionContext>(
    () => ({ user, loading }),
    [user, loading]
  );

  return (
    <SessionCtx.Provider value={value}>
      {children}
    </SessionCtx.Provider>
  );
}
