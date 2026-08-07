import { describe, expect, it } from "vitest";
import type { AuditData, Recommendation } from "@/lib/types";
import type { DetectedCompetitorChange } from "@/lib/competitor-monitor/types";
import { generateAuditAlerts, generateCompetitorAlerts } from "./generate";

function rec(
  partial: Partial<Recommendation> & Pick<Recommendation, "id" | "problem">
): Recommendation {
  return {
    pillar: "conversion",
    severity: "critical",
    impact: "high",
    solution: "أصلح المشكلة الآن.",
    ...partial,
  };
}

function audit(
  overall: number,
  pillars: Partial<Record<"conversion" | "seo" | "geo" | "trust", number>>,
  recommendations: Recommendation[],
  opts?: {
    hasProductSchema?: boolean;
    productSchemaStatus?: "pass" | "warn" | "fail";
  }
): AuditData {
  const hasProductSchema = opts?.hasProductSchema ?? false;
  const productSchemaStatus =
    opts?.productSchemaStatus ?? (hasProductSchema ? "pass" : "fail");
  const breakdown = (["conversion", "seo", "geo", "trust"] as const).map(
    (pillar) => ({
      pillar,
      score: pillars[pillar] ?? 50,
      max: 100,
      label: pillar,
      summary: `${pillar} ok`,
    })
  );
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
      findings: [
        {
          id: "product-schema",
          status: productSchemaStatus,
          label: "مخطط المنتج",
          detail: hasProductSchema ? "موجود" : "مفقود",
        },
      ],
      componentScores: {
        faq: 50,
        productSchema: hasProductSchema ? 12 : 0,
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
        hasProductSchema,
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

describe("generateAuditAlerts", () => {
  it("emits overall and geo drop alerts", () => {
    const previous = audit(70, { geo: 60, trust: 70, seo: 65, conversion: 65 }, []);
    const latest = audit(55, { geo: 45, trust: 70, seo: 65, conversion: 65 }, []);
    const alerts = generateAuditAlerts({
      latest,
      previous,
      auditId: "audit-2",
    });

    const types = alerts.map((a) => a.alertType);
    expect(types).toContain("overall_score_drop");
    expect(types).toContain("geo_score_drop");
    const overall = alerts.find((a) => a.alertType === "overall_score_drop")!;
    expect(overall.priority).toBe("critical");
    expect(overall.title).toBeTruthy();
    expect(overall.reason).toBeTruthy();
    expect(overall.businessImpact).toBeTruthy();
    expect(overall.suggestedAction).toBeTruthy();
    expect(overall.dedupeKey).toBe("overall_score_drop:audit-2");
  });

  it("emits trust_signals_lost when trust collapses", () => {
    const previous = audit(70, { trust: 72, geo: 50, seo: 50, conversion: 50 }, []);
    const latest = audit(60, { trust: 28, geo: 50, seo: 50, conversion: 50 }, []);
    const alerts = generateAuditAlerts({
      latest,
      previous,
      auditId: "audit-trust",
    });
    expect(alerts.some((a) => a.alertType === "trust_signals_lost")).toBe(true);
  });

  it("emits schema_invalid when product schema disappears", () => {
    const previous = audit(
      70,
      { geo: 60 },
      [],
      { hasProductSchema: true, productSchemaStatus: "pass" }
    );
    const latest = audit(
      65,
      { geo: 50 },
      [],
      { hasProductSchema: false, productSchemaStatus: "fail" }
    );
    const alerts = generateAuditAlerts({
      latest,
      previous,
      auditId: "audit-schema",
    });
    const schema = alerts.find((a) => a.alertType === "schema_invalid");
    expect(schema).toBeTruthy();
    expect(schema!.priority).toBe("critical");
  });

  it("emits store_healthier on meaningful health gain", () => {
    const previous = audit(50, { geo: 40, seo: 40, trust: 40, conversion: 40 }, []);
    const latest = audit(60, { geo: 55, seo: 55, trust: 55, conversion: 55 }, []);
    const alerts = generateAuditAlerts({
      latest,
      previous,
      auditId: "audit-up",
    });
    expect(alerts.some((a) => a.alertType === "store_healthier")).toBe(true);
  });

  it("emits important_recommendation for new critical findings", () => {
    const previous = audit(60, {}, []);
    const latest = audit(60, {}, [
      rec({ id: "r1", problem: "زر الشراء غير واضح", severity: "critical" }),
    ]);
    const alerts = generateAuditAlerts({
      latest,
      previous,
      auditId: "audit-rec",
    });
    const important = alerts.filter((a) => a.alertType === "important_recommendation");
    expect(important).toHaveLength(1);
    expect(important[0]!.priority).toBe("critical");
    expect(important[0]!.suggestedAction).toContain("أصلح");
  });

  it("does not repeat unchanged recommendations", () => {
    const shared = [
      rec({ id: "r1", problem: "نفس المشكلة", severity: "critical" }),
    ];
    const previous = audit(60, {}, shared);
    const latest = audit(60, {}, shared);
    const alerts = generateAuditAlerts({
      latest,
      previous,
      auditId: "audit-same",
    });
    expect(alerts.filter((a) => a.alertType === "important_recommendation")).toHaveLength(
      0
    );
  });
});

describe("generateCompetitorAlerts", () => {
  it("maps price_drop and improvement changes", () => {
    const changes: DetectedCompetitorChange[] = [
      {
        changeType: "price_drop",
        severity: "critical",
        fieldPath: "price",
        previousValue: "100",
        currentValue: "80",
        summary: "انخفض السعر",
        businessImpact: "ضغط على التحويل",
        recommendedAction: "راجع عرضك",
      },
      {
        changeType: "ai_visibility_change",
        severity: "critical",
        fieldPath: "geoScore",
        previousValue: 40,
        currentValue: 55,
        summary: "ارتفع GEO",
        businessImpact: "المنافس يظهر أكثر في AI",
        recommendedAction: "عزّز Schema",
      },
      {
        changeType: "title_change",
        severity: "info",
        fieldPath: "title",
        previousValue: "a",
        currentValue: "b",
        summary: "تغيّر العنوان",
        businessImpact: "أثر محدود",
        recommendedAction: "راقب",
      },
    ];

    const alerts = generateCompetitorAlerts({
      changes,
      targetId: "target-1",
      snapshotId: "snap-1",
      targetLabel: "منافس أ",
      targetUrl: "https://rival.example",
    });

    expect(alerts.map((a) => a.alertType).sort()).toEqual([
      "competitor_improved",
      "competitor_price_drop",
    ]);
    expect(alerts.every((a) => a.title && a.reason && a.businessImpact && a.suggestedAction)).toBe(
      true
    );
    expect(alerts.find((a) => a.alertType === "competitor_price_drop")!.priority).toBe(
      "critical"
    );
  });
});
