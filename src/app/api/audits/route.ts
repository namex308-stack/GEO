import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { listAuditsForUser } from "@/lib/db/audit-repository";

const QuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
});

export async function GET(req: NextRequest) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const parsed = QuerySchema.safeParse({
    q: req.nextUrl.searchParams.get("q") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "معطى بحث غير صالح" }, { status: 400 });
  }

  const q = parsed.data.q;
  const audits = await listAuditsForUser(auth.user.id, 50, q);
  return NextResponse.json({ audits, q: q || null });
}
