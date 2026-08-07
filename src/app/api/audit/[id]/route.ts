import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteAuditForUser,
  getAuditAccessForUser,
  getAuditByIdForUser,
} from "@/lib/db/audit-repository";
import { requireApiUser } from "@/lib/auth/require-api-user";
import { isAuditInProgress, isPlaceholderAuditId } from "@/lib/audits/types";

const IdSchema = z.string().uuid();

async function parseOwnedAuditId(
  context: { params: Promise<{ id: string }> }
): Promise<
  | { ok: true; id: string }
  | { ok: false; response: NextResponse }
> {
  const { id } = await context.params;

  if (isPlaceholderAuditId(id)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "تقارير العرض التوضيحي معطّلة. شغّل تدقيقًا حقيقيًا بدلاً من ذلك." },
        { status: 404 }
      ),
    };
  }

  const parsedId = IdSchema.safeParse(id);
  if (!parsedId.success) {
    return {
      ok: false,
      response: NextResponse.json({ error: "معرف تدقيق غير صالح" }, { status: 400 }),
    };
  }

  return { ok: true, id: parsedId.data };
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const parsed = await parseOwnedAuditId(context);
  if (!parsed.ok) return parsed.response;

  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const stored = await getAuditByIdForUser(parsed.id, auth.user.id);
  if (!stored) {
    return NextResponse.json({ error: "لم يتم العثور على التدقيق" }, { status: 404 });
  }

  return NextResponse.json({
    audit: stored.audit,
    demoMode: stored.demoMode,
    aiConfigured: stored.aiConfigured,
    analysisRuns: stored.analysisRuns,
  });
}

/** Delete an audit the caller owns or can access via workspace membership. */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const parsed = await parseOwnedAuditId(context);
  if (!parsed.ok) return parsed.response;

  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const deleted = await deleteAuditForUser(parsed.id, auth.user.id);
  if (!deleted) {
    return NextResponse.json({ error: "لم يتم العثور على التدقيق" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, id: parsed.id });
}

/**
 * Retry payload for an existing audit — returns the original URLs so the
 * client can re-run via the existing POST /api/audit pipeline (quota, crawl, AI).
 */
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const parsed = await parseOwnedAuditId(context);
  if (!parsed.ok) return parsed.response;

  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;

  const meta = await getAuditAccessForUser(parsed.id, auth.user.id);
  if (!meta) {
    return NextResponse.json({ error: "لم يتم العثور على التدقيق" }, { status: 404 });
  }

  if (isAuditInProgress(meta.status)) {
    return NextResponse.json(
      { error: "هذا التحليل ما زال قيد التنفيذ. انتظر حتى يكتمل أو يفشل." },
      { status: 409 }
    );
  }

  return NextResponse.json({
    retry: {
      productUrl: meta.productUrl,
      storeUrl: meta.storeUrl ?? "",
      competitorUrl: meta.competitorUrl ?? "",
      status: meta.status,
    },
  });
}
