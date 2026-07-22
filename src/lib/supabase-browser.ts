"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Browser-side Supabase client (PKCE + cookie storage for SSR callback exchange).
 * Returns null if not configured (e.g. demo mode).
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!_client) {
    _client = createBrowserClient(url, key);
  }
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Persist post-auth destination for the server callback (avoid query params on redirectTo). */
export function setAuthRedirectCookie(path: string) {
  document.cookie = `auth_redirect=${encodeURIComponent(path)}; path=/; max-age=600; samesite=lax`;
}
