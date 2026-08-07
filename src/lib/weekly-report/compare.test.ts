import { describe, expect, it } from "vitest";
import type { AuditData, Recommendation } from "@/lib/types";
import { compareAudits, MEANINGFUL_SCORE_DELTA, recommendationKey } from "./compare";
import { buildWeeklyReportPayload } from "./build";

function rec(partial: Partial<Recommendation> & Pick<Recommendation, "id" | "problem">): Recommendation {
  return {
    pillar: "conversion",
    severity: "warning",
    impact: "medium",
    solution: "أصلح المشكلة.",
    ...partial,
  };
}

function audit(
  overall: number,
  pillars: Partial<Record<"conversion" | "seo" | "geo" | "trust", number>>,
  recommendations: Recommendation[]
): AuditData {
  const breakdown = (["conversion", "seo", "geo", "trust"] as const).map((pillar) => ({
    pillar,
    score: pillars[pillar] ?? 50,
    max: 100,
    label: pillar,
    summary: `${pillar} ok`,
  }));
  return {
    productUrl: "https://shop.example/p/1",
    storeName: "متجر تجريبي",
    productName: "منتج",
    overallScore: overall,
    breakdown,
    recommendations,
    geoReadability: { chatgpt: 50, perplexity: 50, googleAI: 50 },
    geoAnalysis: {
      score: pillars.geo ?? 50,
      summary: "geo",
      findings: [],
      componentScores: {
        faq: 50,
        productSchema: 50,
        organizationSchema: 50,
        breadcrumbSchema: 50,
        headings: 50,
        contentStructure: 50,
        internalLinks: 50,
        entityRichness: 50,
        metadata: 50,
        contentClarity: 50,
      },
      signals: {
        faqCount: 0,
        hasFaq: false,
        hasFaqSchema: false,
        hasProductSchema: false,
        hasOrganizationSchema: false,
        hasBreadcrumbSchema: false,
        headingCount: 0,
        internalLinkCount: 0,
        wordCount: 100,
      },
    },
    createdAt: new Date().toISOString(),
  };
}

describe("weekly-report compare", () => {
  it("flags only meaningful score deltas", () => {
    const previous = audit(60, { geo: 40, seo: 55, trust: 70, conversion: 50 }, []);
    const latest = audit(63, { geo: 41, seo: 60, trust: 70, conversion: 50 }, []);
    const diff = compareAudits(latest, previous);

    expect(MEANINGFUL_SCORE_DELTA).toBe(2);
    expect(diff.overallScoreChange.meaningful).toBe(true);
    expect(diff.overallScoreChange.delta).toBe(3);
    expect(diff.geoScoreChange.meaningful).toBe(false);
    expect(diff.seoScoreChange.meaningful).toBe(true);
    expect(diff.seoScoreChange.delta).toBe(5);
    expect(diff.trustScoreChange.meaningful).toBe(false);
  });

  it("detects new and resolved issues by normalized problem key", () => {
    const shared = rec({ id: "a", problem: "وصف المنتج ضعيف." });
    const previous = audit(50, {}, [
      shared,
      rec({ id: "b", problem: "لا توجد سياسة إرجاع واضحة." }),
    ]);
    const latest = audit(55, {}, [
      shared,
      rec({ id: "c", problem: "صور المنتج غير كافية." }),
    ]);

    const diff = compareAudits(latest, previous);
    expect(diff.newIssues.map((i) => i.id)).toEqual(["c"]);
    expect(diff.resolvedIssues.map((i) => i.id)).toEqual(["b"]);
  });

  it("does not repeat unchanged recommendations in priority actions", () => {
    const unchanged = rec({
      id: "same",
      problem: "زر الشراء غير بارز.",
      severity: "warning",
      impact: "medium",
    });
    const worsened = rec({
      id: "worse",
      problem: "الدفع المحلي غير واضح.",
      severity: "critical",
      impact: "high",
    });
    const previous = audit(50, {}, [
      unchanged,
      rec({
        id: "worse",
        problem: "الدفع المحلي غير واضح.",
        severity: "warning",
        impact: "medium",
      }),
    ]);
    const latest = audit(52, {}, [unchanged, worsened]);

    const diff = compareAudits(latest, previous);
    expect(diff.highestPriorityActions.map((a) => a.id)).toEqual(["worse"]);
    expect(diff.highestPriorityActions[0]?.reason).toBe("worsened");
    expect(
      diff.highestPriorityActions.some((a) => recommendationKey(a) === recommendationKey(unchanged))
    ).toBe(false);
  });

  it("builds a full weekly payload with all required sections", () => {
    const previous = audit(48, { geo: 30, seo: 40, trust: 55, conversion: 45 }, [
      rec({ id: "old", problem: "مشكلة قديمة." }),
    ]);
    const latest = audit(58, { geo: 45, seo: 50, trust: 60, conversion: 55 }, [
      rec({ id: "new", problem: "مشكلة جديدة.", severity: "critical", impact: "high" }),
    ]);

    const payload = buildWeeklyReportPayload({
      storeId: "store-1",
      storeName: "متجر تجريبي",
      storeUrl: "https://shop.example",
      workspaceId: "ws-1",
      periodStart: "2026-08-01T00:00:00.000Z",
      periodEnd: "2026-08-07T23:59:59.999Z",
      latest,
      previous,
      latestAuditId: "audit-2",
      previousAuditId: "audit-1",
    });

    expect(payload.executiveSummary.headline).toContain("متجر تجريبي");
    expect(payload.overallScoreChange.delta).toBe(10);
    expect(payload.geoScoreChange.current).toBe(45);
    expect(payload.seoScoreChange.delta).toBe(10);
    expect(payload.trustScoreChange.delta).toBe(5);
    expect(payload.conversionScoreChange.delta).toBe(10);
    expect(payload.newIssues).toHaveLength(1);
    expect(payload.resolvedIssues).toHaveLength(1);
    expect(payload.highestPriorityActions[0]?.id).toBe("new");
    expect(payload.aiExecutiveSummary.length).toBeGreaterThan(20);
    expect(payload.meaningfulChangeCount).toBeGreaterThan(0);
  });
});
