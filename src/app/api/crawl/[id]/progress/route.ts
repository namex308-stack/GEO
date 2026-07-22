import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    const sb = getSupabaseAdmin();

    if (!sb || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: audit, error } = await sb
      .from("audits")
      .select("id, status, audit_type, crawl_progress, crawl_summary, overall_score, error_message")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !audit || audit.audit_type !== "crawl") {
      return NextResponse.json({ error: "Crawl audit not found" }, { status: 404 });
    }

    const { count: pagesTotal } = await sb
      .from("crawled_pages")
      .select("id", { count: "exact", head: true })
      .eq("audit_id", id);

    const { count: pagesComplete } = await sb
      .from("crawled_pages")
      .select("id", { count: "exact", head: true })
      .eq("audit_id", id)
      .eq("status", "complete");

    return NextResponse.json({
      auditId: audit.id,
      status: audit.status,
      progress: audit.crawl_progress,
      summary: audit.crawl_summary,
      overallScore: audit.overall_score,
      pagesTotal: pagesTotal ?? 0,
      pagesComplete: pagesComplete ?? 0,
      error: audit.error_message,
    });
  } catch (err) {
    console.error("[api/crawl/[id]/progress] GET error:", err);
    return NextResponse.json({ error: "Failed to load crawl progress." }, { status: 500 });
  }
}
