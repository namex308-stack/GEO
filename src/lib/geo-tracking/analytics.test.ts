import { describe, expect, it } from "vitest";
import { buildGeoTrackingSummary, explainGeoScoreChange } from "./analytics";
import { buildGeoHistoryRow } from "./record";
import type { GeoHistoryPoint } from "./types";
import type { GeoAnalysisResult } from "@/lib/types";

function point(
  partial: Partial<GeoHistoryPoint> & Pick<GeoHistoryPoint, "auditId" | "overallGeoScore" | "recordedAt">
): GeoHistoryPoint {
  return {
    id: partial.id ?? partial.auditId,
    storeId: null,
    citationScore: partial.citationScore ?? partial.overallGeoScore,
    schemaScore: partial.schemaScore ?? 40,
    entityScore: partial.entityScore ?? 40,
    faqScore: partial.faqScore ?? 40,
    aiReadability: partial.aiReadability ?? 50,
    findings: partial.findings ?? [],
    ...partial,
  };
}

describe("geo-tracking analytics", () => {
  it("builds trend, best/worst, improvement and regression percentages", () => {
    const summary = buildGeoTrackingSummary([
      point({
        auditId: "a1",
        overallGeoScore: 40,
        recordedAt: "2026-07-01T10:00:00.000Z",
        faqScore: 20,
        schemaScore: 30,
      }),
      point({
        auditId: "a2",
        overallGeoScore: 55,
        recordedAt: "2026-07-08T10:00:00.000Z",
        faqScore: 60,
        schemaScore: 50,
      }),
      point({
        auditId: "a3",
        overallGeoScore: 50,
        recordedAt: "2026-07-15T10:00:00.000Z",
        faqScore: 55,
        schemaScore: 45,
      }),
    ]);

    expect(summary.graph).toHaveLength(3);
    expect(summary.bestScore).toBe(55);
    expect(summary.worstScore).toBe(40);
    expect(summary.firstScore).toBe(40);
    expect(summary.latestScore).toBe(50);
    expect(summary.netDelta).toBe(10);
    expect(summary.trend).toBe("up");
    expect(summary.improvementPct).toBeGreaterThan(0);
    expect(summary.regressionPct).toBeGreaterThan(0);
    expect(summary.improvementPct + summary.regressionPct).toBe(100);
    expect(summary.latestExplanation?.delta).toBe(-5);
  });

  it("explains why the score changed with fixes and issues", () => {
    const prev = point({
      auditId: "a1",
      overallGeoScore: 45,
      recordedAt: "2026-07-01T10:00:00.000Z",
      faqScore: 20,
      schemaScore: 40,
      findings: [
        {
          id: "geo-faq",
          status: "fail",
          label: "FAQ",
          detail: "لا توجد أسئلة شائعة",
        },
      ],
    });
    const curr = point({
      auditId: "a2",
      overallGeoScore: 62,
      recordedAt: "2026-07-08T10:00:00.000Z",
      faqScore: 80,
      schemaScore: 35,
      findings: [
        {
          id: "geo-faq",
          status: "pass",
          label: "FAQ",
          detail: "تم العثور على أسئلة شائعة",
        },
      ],
    });

    const explanation = explainGeoScoreChange(prev, curr);
    expect(explanation.whyChanged).toContain("ارتفع");
    expect(explanation.fixesImproved.some((f) => f.includes("FAQ") || f.includes("الأسئلة"))).toBe(
      true
    );
    expect(explanation.issuesReduced.some((f) => f.includes("Schema"))).toBe(true);
  });

  it("builds a history row from audit GEO payload without running the engine", () => {
    const geoAnalysis: GeoAnalysisResult = {
      score: 71,
      summary: "جيد",
      findings: [
        {
          id: "geo-faq",
          status: "pass",
          label: "FAQ",
          detail: "ok",
        },
      ],
      componentScores: {
        faq: 12,
        productSchema: 8,
        organizationSchema: 0,
        breadcrumbSchema: 0,
        headings: 5,
        contentStructure: 4,
        internalLinks: 3,
        entityRichness: 6,
        metadata: 4,
        contentClarity: 8,
      },
      signals: {
        faqCount: 3,
        hasFaq: true,
        hasFaqSchema: true,
        hasProductSchema: true,
        hasOrganizationSchema: false,
        hasBreadcrumbSchema: false,
        headingCount: 4,
        internalLinkCount: 2,
        wordCount: 400,
      },
    };

    const row = buildGeoHistoryRow({
      workspaceId: "ws",
      auditId: "audit-1",
      geoAnalysis,
      geoReadability: { chatgpt: 70, perplexity: 65, googleAI: 60 },
    });

    expect(row).not.toBeNull();
    expect(row!.overallGeoScore).toBe(71);
    expect(row!.citationScore).toBe(71);
    expect(row!.faqScore).toBeGreaterThan(0);
    expect(row!.schemaScore).toBeGreaterThan(0);
    expect(row!.entityScore).toBeGreaterThan(0);
    expect(row!.aiReadability).toBe(65);
    expect(row!.findings).toHaveLength(1);
  });
});
