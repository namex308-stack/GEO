import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { getUsageSummaryForUser } from "@/lib/db/workspace-stats";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const usage = await getUsageSummaryForUser(auth.user.id);
  return NextResponse.json({ usage });
}
