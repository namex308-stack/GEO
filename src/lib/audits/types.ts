import type { AuditStatus } from "@/lib/db/types";

/** Arabic fallbacks when product/store names are missing in persisted audits. */
export const FALLBACK_PRODUCT_NAME = "منتج";
export const FALLBACK_STORE_NAME = "متجر";

/** Legacy placeholder id — real audits use UUIDs. */
export const PLACEHOLDER_AUDIT_ID = "demo";

export function isPlaceholderAuditId(id: string): boolean {
  return id === PLACEHOLDER_AUDIT_ID;
}

const IN_PROGRESS_STATUSES: ReadonlySet<AuditStatus> = new Set([
  "queued",
  "scraping",
  "analyzing",
]);

export function isAuditInProgress(status: string): boolean {
  return IN_PROGRESS_STATUSES.has(status as AuditStatus);
}

export function canRetryAuditStatus(status: string): boolean {
  return status === "failed" || status === "completed";
}

/** List/history row shape returned by GET /api/audits and dashboard.recent. */
export type AuditHistoryItem = {
  id: string;
  productName: string;
  storeName: string;
  productUrl: string;
  overallScore: number | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
  pageCount?: number;
  openIssues?: number;
};
