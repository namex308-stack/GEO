import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { listWeeklyReportsForUser } from "@/lib/db/weekly-report-repository";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const reports = await listWeeklyReportsForUser(auth.user.id, 30);
  return NextResponse.json({ reports });
}
