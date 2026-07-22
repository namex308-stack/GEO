import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth/get-user";
import { getUserBillingContext } from "@/lib/billing/usage";
import { enrichIssues } from "@/lib/engines/orchestrator";
import type { Recommendation } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const { data, error } = await sb
      .from("audits")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    const ctx = await getUserBillingContext(user.id);
    const recommendations = enrichIssues(
      (data.recommendations as Recommendation[]) ?? [],
      ctx.plan
    );

    return NextResponse.json({
      audit: { ...data, recommendations },
      plan: ctx.plan,
    });
  } catch (err) {
    console.error("[api/audit/[id]] GET error:", err);
    return NextResponse.json({ error: "Failed to load audit." }, { status: 500 });
  }
}
