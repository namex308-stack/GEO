import { NextRequest, NextResponse } from "next/server";
import { getAuditByIdForUser } from "@/lib/db/audit-repository";
import { requireApiUser } from "@/lib/auth/require-api-user";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (id === "demo") {
    return NextResponse.json(
      { error: "تقارير العرض التوضيحي معطّلة. شغّل تدقيقًا حقيقيًا بدلاً من ذلك." },
      { status: 404 }
    );
  }

  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const stored = await getAuditByIdForUser(id, auth.user.id);
  if (!stored) {
    return NextResponse.json({ error: "لم يتم العثور على التدقيق" }, { status: 404 });
  }

  return NextResponse.json({
    audit: stored.audit,
    demoMode: stored.demoMode,
    aiConfigured: stored.aiConfigured,
    analysisRuns: stored.analysisRuns,
  });
}
