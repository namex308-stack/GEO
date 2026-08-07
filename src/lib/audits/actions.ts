/**
 * Client helpers for dashboard/history audit actions.
 * Delete uses DELETE /api/audit/[id].
 * Retry resolves URLs via POST /api/audit/[id], then reuses POST /api/audit.
 */

export { canRetryAuditStatus } from "@/lib/audits/types";

export type AuditActionFailureCode =
  | "delete_failed"
  | "retry_meta_failed"
  | "retry_failed"
  | "retry_no_id";

export type AuditActionResult =
  | { ok: true; auditId?: string }
  | {
      ok: false;
      code: AuditActionFailureCode | string;
      error?: string;
      resumePath?: string;
    };

export async function deleteAuditRequest(
  auditId: string
): Promise<AuditActionResult> {
  const res = await fetch(`/api/audit/${auditId}`, { method: "DELETE" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return {
      ok: false,
      code: "delete_failed",
      error: data.error,
    };
  }
  return { ok: true };
}

export async function retryAuditRequest(
  auditId: string
): Promise<AuditActionResult & { auditId?: string }> {
  const metaRes = await fetch(`/api/audit/${auditId}`, { method: "POST" });
  const metaJson = (await metaRes.json().catch(() => ({}))) as {
    error?: string;
    retry?: { productUrl: string; storeUrl: string; competitorUrl: string };
  };
  if (!metaRes.ok || !metaJson.retry?.productUrl) {
    return {
      ok: false,
      code: "retry_meta_failed",
      error: metaJson.error,
    };
  }

  const res = await fetch("/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productUrl: metaJson.retry.productUrl,
      storeUrl: metaJson.retry.storeUrl || "",
      competitorUrl: metaJson.retry.competitorUrl || "",
      locale: "ar",
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    resumePath?: string;
    audit?: { id?: string };
    meta?: { auditId?: string | null };
  };

  if (!res.ok) {
    return {
      ok: false,
      code: data.code || "retry_failed",
      error: data.error,
      resumePath: data.resumePath,
    };
  }

  const newId = data.meta?.auditId || data.audit?.id;
  if (!newId) {
    return { ok: false, code: "retry_no_id" };
  }

  return { ok: true, auditId: newId };
}
