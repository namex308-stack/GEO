import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest, cronAuthFromHeaders } from "@/lib/automation";
import { runCompetitorMonitorJob } from "@/lib/competitor-monitor/job";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Vercel Cron / external scheduler entrypoint for competitor monitoring. */
export async function GET(req: NextRequest) {
  if (
    !authorizeCronRequest(
      cronAuthFromHeaders({
        authorization: req.headers.get("authorization"),
        secretQuery: req.nextUrl.searchParams.get("secret"),
      })
    )
  ) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  try {
    const result = await runCompetitorMonitorJob();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error(
      "[cron/competitor-monitor]",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "فشل تشغيل مراقبة المنافسين." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
