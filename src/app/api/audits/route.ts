import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { listAuditsForUser } from "@/lib/db/audit-repository";

export async function GET(req: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const q = req.nextUrl.searchParams.get("q") ?? undefined;
  const audits = await listAuditsForUser(auth.user.id, 50, q || undefined);
  return NextResponse.json({ audits, q: q || null });
}
