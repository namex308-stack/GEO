import { NextRequest, NextResponse } from "next/server";
import {
  authorizeCronRequest,
  cronAuthFromHeaders,
  isAutomationJobId,
} from "@/lib/automation";
import { dispatchAutomationJob } from "@/lib/automation/dispatcher";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = { params: Promise<{ jobId: string }> };

/**
 * Unified automation HTTP adapter (Vercel Cron / Supabase pg_net / manual).
 *
 * Not registered in vercel.json. Jobs stay inactive until AUTOMATION_ENABLED=true
 * (and typically AUTOMATION_DRY_RUN=false for live side effects).
 */
async function handle(req: NextRequest, context: RouteContext) {
  const authorized = authorizeCronRequest(
    cronAuthFromHeaders({
      authorization: req.headers.get("authorization"),
      secretQuery: req.nextUrl.searchParams.get("secret"),
    })
  );
  if (!authorized) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  const { jobId: rawJobId } = await context.params;
  if (!isAutomationJobId(rawJobId)) {
    return NextResponse.json(
      { error: "معرّف مهمة غير معروف.", jobId: rawJobId },
      { status: 404 }
    );
  }

  const sourceParam = req.nextUrl.searchParams.get("source");
  const source =
    sourceParam === "supabase_cron"
      ? "supabase_cron"
      : sourceParam === "background_worker"
        ? "background_worker"
        : sourceParam === "manual"
          ? "manual"
          : "vercel_cron";

  try {
    const result = await dispatchAutomationJob({
      jobId: rawJobId,
      source,
    });

    const httpStatus =
      result.status === "failed"
        ? 500
        : result.status === "skipped_disabled"
          ? 503
          : 200;

    return NextResponse.json(
      {
        ok: result.status === "succeeded" || result.status === "skipped_dry_run",
        result,
      },
      { status: httpStatus }
    );
  } catch (err) {
    console.error(
      "[cron/automation]",
      rawJobId,
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "فشل تشغيل مهمة الأتمتة." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  return handle(req, context);
}

export async function POST(req: NextRequest, context: RouteContext) {
  return handle(req, context);
}
