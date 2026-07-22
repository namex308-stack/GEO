import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

/** Create or update the user's profile row after auth (fallback if DB trigger fails). */
export async function ensureUserProfile(user: User): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;

  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email?.split("@")[0] ||
    "User";

  const { error } = await sb.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      name,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("[ensureUserProfile] failed:", error.message);
  }
}
