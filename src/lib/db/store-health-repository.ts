import "server-only";

import {
  getAuditByIdForUser,
  listAuditsForUser,
} from "@/lib/db/audit-repository";
import { getSupabaseAdmin } from "@/lib/supabase";
import { composeStoreHealth } from "@/lib/store-health/compose";
import type { StoreHealthPayload } from "@/lib/store-health/types";

export async function getStoreHealthForUser(
  userId: string
): Promise<StoreHealthPayload> {
  const audits = await listAuditsForUser(userId, 50);
  const completed = audits.filter(
    (a) => a.status === "completed" && a.overallScore != null
  );
  const latest = completed[0] ?? null;

  if (!latest) {
    return composeStoreHealth({
      audit: null,
      crawlDurationMs: null,
      completedAudits: [],
    });
  }

  const [stored, crawlDurationMs] = await Promise.all([
    getAuditByIdForUser(latest.id, userId),
    getCrawlDurationMs(latest.id),
  ]);

  return composeStoreHealth({
    audit: stored?.audit
      ? { ...stored.audit, id: latest.id, createdAt: latest.completedAt || latest.createdAt }
      : null,
    crawlDurationMs,
    completedAudits: completed.map((a) => ({
      overallScore: a.overallScore,
      completedAt: a.completedAt,
      createdAt: a.createdAt,
    })),
  });
}

async function getCrawlDurationMs(auditId: string): Promise<number | null> {
  const sb = getSupabaseAdmin();
  if (!sb) return null;
  const { data } = await sb
    .from("audits")
    .select("crawl_duration_ms")
    .eq("id", auditId)
    .maybeSingle();
  return data?.crawl_duration_ms != null ? Number(data.crawl_duration_ms) : null;
}
