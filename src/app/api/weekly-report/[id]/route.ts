import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { getWeeklyReportForUser } from "@/lib/db/weekly-report-repository";

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const raw = await ctx.params;
  const parsed = ParamsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "معرّف غير صالح." }, { status: 400 });
  }

  const report = await getWeeklyReportForUser(parsed.data.id, auth.user.id);
  if (!report) {
    return NextResponse.json({ error: "التقرير غير موجود." }, { status: 404 });
  }

  return NextResponse.json({
    report: {
      id: report.id,
      workspaceId: report.workspaceId,
      storeId: report.storeId,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      latestAuditId: report.latestAuditId,
      previousAuditId: report.previousAuditId,
      status: report.status,
      generatedAt: report.generatedAt,
      emailSentAt: report.emailSentAt,
      payload: report.payload,
      emailHtml: report.emailHtml,
    },
  });
}
