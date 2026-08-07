import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiUser } from "@/lib/auth/require-api-user";
import {
  getCompetitorTargetForUser,
  listChangesForTarget,
  listSnapshotsForTarget,
} from "@/lib/db/competitor-monitor-repository";
import { buildMonitorInsights } from "@/lib/competitor-monitor/diff";
import type { CompetitorTargetDetail } from "@/lib/competitor-monitor/types";

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

  const target = await getCompetitorTargetForUser(parsed.data.id, auth.user.id);
  if (!target) {
    return NextResponse.json({ error: "المنافس غير موجود." }, { status: 404 });
  }

  const [snapshots, timeline] = await Promise.all([
    listSnapshotsForTarget(target.id, 30),
    listChangesForTarget(target.id, 50),
  ]);

  const latestChanges = timeline.slice(0, 12);
  const insights = buildMonitorInsights(latestChanges);

  const detail: CompetitorTargetDetail = {
    target,
    snapshots,
    timeline,
    latestChanges,
    businessImpact: insights.businessImpact,
    recommendedActions: insights.recommendedActions,
  };

  return NextResponse.json({ detail });
}
