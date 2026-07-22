import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isInvalidRefreshTokenError } from "@/lib/auth/is-invalid-refresh-token";

export async function createSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // In Server Components we can't set cookies — swallow the error.
          // The middleware handles session refresh before the page renders.
        }
      },
    },
  });
}

/** Per-request memoized auth lookup (layout + page share one call). */
export const getUser = cache(async () => {
  const supabase = await createSupabaseServer();
  if (!supabase) return null;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      // Stale refresh tokens are cleared in middleware; treat as signed out.
      if (isInvalidRefreshTokenError(error)) return null;
      return null;
    }
    return user;
  } catch {
    return null;
  }
});
