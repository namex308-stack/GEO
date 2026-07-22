"use client";

import { getSupabaseBrowser } from "@/lib/supabase-browser";

export async function signOut(): Promise<void> {
  const sb = getSupabaseBrowser();
  if (sb) {
    try {
      await sb.auth.signOut();
    } catch {
      /* proceed to redirect regardless */
    }
  }
  window.location.href = "/login";
}
