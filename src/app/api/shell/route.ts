import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { getShellForUser } from "@/lib/db/workspace-stats";

/** Lightweight topbar/nav payload — prefer over /api/dashboard for shell chrome. */
export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const shell = await getShellForUser(auth.user.id);
  return NextResponse.json({ shell });
}
