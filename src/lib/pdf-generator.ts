import "server-only";

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { AuditReportPDF } from "@/lib/pdf/audit-report-pdf";
import type { AuditData } from "@/lib/types";

/**
 * Map a Supabase audits row (snake_case) into AuditData for PDF rendering.
 */
export function mapAuditRowToPdfData(audit: {
  product_url: string;
  product_name?: string | null;
  store_name?: string | null;
  competitor_url?: string | null;
  overall_score?: number | null;
  competitor_score?: number | null;
  breakdown?: AuditData["breakdown"] | null;
  competitor_breakdown?: AuditData["competitorBreakdown"] | null;
  geo_readability?: AuditData["geoReadability"] | null;
  recommendations?: AuditData["recommendations"] | null;
  created_at?: string | null;
  engine_results?: AuditData["engineResults"] | null;
  eye_test_result?: AuditData["customerEyeTest"] | null;
}): AuditData {
  return {
    productUrl: audit.product_url,
    productName: audit.product_name || "Product",
    storeName: audit.store_name || "Store",
    competitorUrl: audit.competitor_url ?? undefined,
    overallScore: audit.overall_score ?? 0,
    competitorScore: audit.competitor_score ?? undefined,
    breakdown: audit.breakdown ?? [],
    competitorBreakdown: audit.competitor_breakdown ?? undefined,
    geoReadability: audit.geo_readability ?? { chatgpt: 0, perplexity: 0, googleAI: 0 },
    recommendations: audit.recommendations ?? [],
    createdAt: audit.created_at ?? new Date().toISOString(),
    engineResults: audit.engine_results ?? undefined,
    customerEyeTest: audit.eye_test_result ?? undefined,
  };
}

/**
 * Render audit PDF (cover + scores + recommendations + footer via AuditReportPDF).
 */
export async function generateAuditPdfBuffer(audit: AuditData): Promise<Buffer> {
  const buffer = await renderToBuffer(
    React.createElement(AuditReportPDF, { audit }) as Parameters<typeof renderToBuffer>[0]
  );
  return Buffer.from(buffer);
}
