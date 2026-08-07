import { describe, expect, it } from "vitest";
import type { Recommendation } from "@/lib/types";
import {
  buildConsultantRecommendationView,
  businessImpactDetail,
  effortLabelKey,
  formatRecommendationCopy,
  impactLabelKey,
  PILLAR_LABEL_KEYS,
  priorityBadgeLevel,
  severityLabelKey,
} from "./recommendation-display";

function baseRec(partial: Partial<Recommendation> = {}): Recommendation {
  return {
    id: "r1",
    pillar: "conversion",
    severity: "critical",
    problem: "الوصف لا يوضح الفائدة.",
    solution: "أعد كتابة الفقرة الأولى بفائدة واضحة.",
    impact: "high",
    ...partial,
  };
}

describe("recommendation-display", () => {
  it("maps impact levels to report i18n keys", () => {
    expect(impactLabelKey("high")).toBe("report.highImpact");
    expect(impactLabelKey("medium")).toBe("report.mediumImpact");
    expect(impactLabelKey("low")).toBe("report.lowImpact");
  });

  it("maps effort levels and tolerates missing effort", () => {
    expect(effortLabelKey("quick")).toBe("report.quickFix");
    expect(effortLabelKey("medium")).toBe("report.mediumEffort");
    expect(effortLabelKey("involved")).toBe("report.involved");
    expect(effortLabelKey(undefined)).toBeNull();
  });

  it("maps severity and pillar label keys consistently", () => {
    expect(severityLabelKey("critical")).toBe("severity.critical");
    expect(severityLabelKey("opportunity")).toBe("severity.opportunity");
    expect(PILLAR_LABEL_KEYS.geo).toBe("pillar.geo");
    expect(PILLAR_LABEL_KEYS.trust).toBe("pillar.trust");
  });

  it("maps presentation priority badges without changing ranking fields", () => {
    expect(priorityBadgeLevel(baseRec({ severity: "critical", impact: "low" }))).toBe(
      "critical"
    );
    expect(priorityBadgeLevel(baseRec({ severity: "warning", impact: "high" }))).toBe(
      "high"
    );
    expect(priorityBadgeLevel(baseRec({ severity: "warning", impact: "medium" }))).toBe(
      "medium"
    );
    expect(
      priorityBadgeLevel(baseRec({ severity: "opportunity", impact: "low" }))
    ).toBe("low");
  });

  it("prefers projectedImpact over estimatedLift for business detail", () => {
    expect(
      businessImpactDetail(
        baseRec({ projectedImpact: "رفع التحويل المتوقع", estimatedLift: "+5%" })
      )
    ).toBe("رفع التحويل المتوقع");
    expect(businessImpactDetail(baseRec({ estimatedLift: "+8 نقاط" }))).toBe("+8 نقاط");
    expect(businessImpactDetail(baseRec())).toBeNull();
  });

  it("builds a consultant view answering the six merchant questions", () => {
    const view = buildConsultantRecommendationView(
      baseRec({ effort: "quick", projectedImpact: "زيادة واضحة في إتمام الشراء" })
    );
    expect(view.whatIsWrong).toContain("الوصف");
    expect(view.whyItMatters.length).toBeGreaterThan(10);
    expect(view.ifIgnored.length).toBeGreaterThan(10);
    expect(view.howToFix).toContain("أعد كتابة");
    expect(view.howLong).toContain("دقيقة");
    expect(view.businessImpact).toContain("إتمام الشراء");
    expect(view.categoryKey).toBe("report.categorySales");
  });

  it("formats a copyable Arabic consultant brief with the six questions", () => {
    const text = formatRecommendationCopy(baseRec({ priorityRank: 1, effort: "quick" }), {
      priority: "الأولوية",
      rank: 1,
      whatIsWrong: "ما المشكلة؟",
      whyItMatters: "لماذا يهم؟",
      ifIgnored: "ماذا يحدث إن تجاهلتها؟",
      howToFix: "كيف تصلحها؟",
      howLong: "كم يستغرق الإصلاح؟",
      businessImpact: "الأثر المتوقع على العمل",
      timeValue: "١٥–٤٥ دقيقة",
      businessDetail: "زيادة واضحة في الثقة عند الشراء",
    });
    expect(text).toContain("الأولوية: #1");
    expect(text).toContain("ما المشكلة؟");
    expect(text).toContain("لماذا يهم؟");
    expect(text).toContain("ماذا يحدث إن تجاهلتها؟");
    expect(text).toContain("كيف تصلحها؟");
    expect(text).toContain("كم يستغرق الإصلاح؟");
    expect(text).toContain("الأثر المتوقع على العمل");
    expect(text).toContain("الوصف لا يوضح الفائدة.");
    expect(text).toContain("أعد كتابة الفقرة الأولى بفائدة واضحة.");
  });
});
