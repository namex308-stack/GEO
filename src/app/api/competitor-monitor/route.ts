import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/require-api-user";
import {
  listCompetitorChangesForUser,
  listCompetitorTargetsForUser,
} from "@/lib/db/competitor-monitor-repository";
import { isCompetitorCrawlAllowed } from "@/lib/competitor-monitor/crawl-policy";
import { buildMonitorInsights } from "@/lib/competitor-monitor/diff";
import type { CompetitorMonitorOverview } from "@/lib/competitor-monitor/types";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const [targets, timeline] = await Promise.all([
    listCompetitorTargetsForUser(auth.user.id),
    listCompetitorChangesForUser(auth.user.id, 50),
  ]);

  const latestChanges = timeline.slice(0, 12);
  const insights = buildMonitorInsights(latestChanges);

  const overview: CompetitorMonitorOverview = {
    targets,
    latestChanges,
    timeline,
    businessImpact: insights.businessImpact,
    recommendedActions: insights.recommendedActions,
    crawlEnabled: isCompetitorCrawlAllowed(),
  };

  return NextResponse.json({ monitor: overview });
}
