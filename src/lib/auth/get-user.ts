import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { isInvalidRefreshTokenError } from "@/lib/auth/is-invalid-refresh-token";

export async function getAuthUser(): Promise<User | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();

  const supabase = createServerClient(url, anonKey, {
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
          // Cookie writes can fail in some route contexts; middleware is source of truth.
        }
      },
    },
  });

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      if (isInvalidRefreshTokenError(error)) return null;
      return null;
    }
    return user;
  } catch {
    return null;
  }
}
