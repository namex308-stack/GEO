import { NextRequest, NextResponse } from "next/server";
import { runDueMonitoringJobs, processPendingNotifications } from "@/lib/monitoring/run-monitoring";
import { syncAllExpiredSubscriptions } from "@/lib/billing/usage";

export async function GET(req: NextRequest) {
  try {
    const secret = req.headers.get("authorization")?.replace("Bearer ", "");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || secret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [monitoring, notifications, billing] = await Promise.all([
      runDueMonitoringJobs(),
      processPendingNotifications(),
      syncAllExpiredSubscriptions(),
    ]);

    return NextResponse.json({
      ok: true,
      monitoring,
      notifications,
      billing,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/cron/monitoring] GET error:", err);
    return NextResponse.json({ error: "Cron run failed." }, { status: 500 });
  }
}
