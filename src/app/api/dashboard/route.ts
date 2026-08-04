import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { getDashboardForUser } from "@/lib/db/workspace-stats";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const dashboard = await getDashboardForUser(auth.user.id);
  return NextResponse.json({ dashboard });
}
