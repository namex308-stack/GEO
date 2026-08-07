import { NextRequest, NextResponse } from "next/server";
import { authorizeCronRequest, cronAuthFromHeaders } from "@/lib/automation";
import { runWeeklyReportJob } from "@/lib/weekly-report/job";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Vercel Cron / external scheduler entrypoint for Weekly AI Reports. */
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
    const result = await runWeeklyReportJob();
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error(
      "[cron/weekly-report]",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "فشل تشغيل التقرير الأسبوعي." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
