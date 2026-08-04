import "server-only";

import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth/get-user";

/**
 * Gate for expensive API routes.
 * Requires a valid Supabase session whenever Auth is configured (fail closed).
 */
export async function requireApiUser(): Promise<
  { ok: true; user: User } | { ok: false; response: NextResponse }
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "المصادقة غير مهيأة." },
        { status: 503 }
      ),
    };
  }

  const user = await getAuthUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "المصادقة مطلوبة." }, { status: 401 }),
    };
  }

  return { ok: true, user };
}
