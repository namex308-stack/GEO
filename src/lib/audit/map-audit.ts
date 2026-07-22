import type { AuditData, AuditEngineResultsPayload, CustomerEyeTest, Recommendation, ScoreBreakdown } from "@/lib/types";

function asCustomerEyeTest(value: unknown): CustomerEyeTest | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Partial<CustomerEyeTest>;
  if (typeof v.confusionScore !== "number" || typeof v.mainBlocker !== "string") {
    return undefined;
  }
  return v as CustomerEyeTest;
}

/** Map a Supabase audits row to client AuditData. */
export function mapDbAuditToAuditData(row: Record<string, unknown>): AuditData {
  const engineResults = (row.engine_results as AuditEngineResultsPayload | null) ?? undefined;
  // Prefer dedicated column; fall back to engine_results.customerEyeTest.
  const customerEyeTest =
    asCustomerEyeTest(row.eye_test_result) ??
    asCustomerEyeTest(engineResults?.customerEyeTest);

  return {
    productUrl: String(row.product_url ?? ""),
    storeUrl: row.store_url ? String(row.store_url) : undefined,
    competitorUrl: row.competitor_url ? String(row.competitor_url) : undefined,
    productName: String(row.product_name ?? "Product"),
    storeName: String(row.store_name ?? "Store"),
    overallScore: Number(row.overall_score ?? 0),
    competitorScore: row.competitor_score != null ? Number(row.competitor_score) : undefined,
    breakdown: (row.breakdown as ScoreBreakdown[]) ?? [],
    competitorBreakdown: (row.competitor_breakdown as ScoreBreakdown[] | null) ?? undefined,
    recommendations: (row.recommendations as Recommendation[]) ?? [],
    geoReadability: (row.geo_readability as AuditData["geoReadability"]) ?? {
      chatgpt: 0,
      perplexity: 0,
      googleAI: 0,
    },
    createdAt: String(row.created_at ?? row.completed_at ?? new Date().toISOString()),
    crawlSummary: row.crawl_summary as AuditData["crawlSummary"],
    aiEnhanced: engineResults?.aiEnhanced,
    engineResults,
    customerEyeTest,
  };
}
