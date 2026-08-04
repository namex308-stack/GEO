import type { User } from "@supabase/supabase-js";
import { isInvalidRefreshTokenError } from "@/lib/auth/is-invalid-refresh-token";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuthUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      if (isInvalidRefreshTokenError(error)) return null;
      return null;
    }
    return user;
  } catch {
    return null;
  }
}
