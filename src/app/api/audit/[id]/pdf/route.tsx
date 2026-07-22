import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth/get-user";
import { getUserBillingContext } from "@/lib/billing/usage";
import { canAccessFeature } from "@/lib/plan-gates";
import { generateAuditPdfBuffer, mapAuditRowToPdfData } from "@/lib/pdf-generator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  const sb = getSupabaseAdmin();

  if (!sb || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await getUserBillingContext(user.id);
  if (!canAccessFeature(plan, "pdf")) {
    return NextResponse.json(
      { error: "PDF export requires a Pro or Business plan." },
      { status: 403 }
    );
  }

  const { data: audit, error } = await sb
    .from("audits")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  const buffer = await generateAuditPdfBuffer(mapAuditRowToPdfData(audit));

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="convaudit-audit-${id}.pdf"`,
    },
  });
}
