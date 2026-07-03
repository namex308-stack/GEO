"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * Browser-side Supabase client using the ANON key.
 * Respects RLS. Returns null if not configured (e.g. demo mode).
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!_client) {
    _client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return _client;
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
