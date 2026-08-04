import { describe, expect, it } from "vitest";
import {
  detectLocalPaymentMethods,
  detectShippingReturnsClarity,
  enrichTrustSubChecks,
  enrichTrustWithLocalPayments,
  scoreConversionModule,
  scoreGeoModule,
  scoreSeoModule,
  scoreTrustModule,
  severityFromScore,
  TRUST_PAYMENT_MISSING_FINDING,
} from "@/lib/audit/score-modules";
import type { NormalizedPage } from "@/lib/db/types";

function page(partial: Partial<NormalizedPage> = {}): NormalizedPage {
  return {
    url: partial.url ?? "https://shop.example.com/products/serum",
    title: partial.title ?? "سيروم الوجه",
    description: partial.description ?? "وصف منتج مناسب للبشرة الجافة والحساسة مع فوائد واضحة.",
    pageType: partial.pageType ?? "product",
    markdown: partial.markdown ?? "# سيروم\n\nاشترِ الآن مع ضمان الإرجاع.",
    imageCount: partial.imageCount ?? 2,
    contentHash: partial.contentHash ?? "hash",
    structuredData: partial.structuredData ?? {
      hasPriceSignal: true,
      hasCtaSignal: true,
      price: "199",
      brand: "Glow",
      rating: 4.5,
      jsonLdTypes: ["Product"],
      faq: [{ q: "هل يناسب البشرة الدهنية؟", a: "نعم" }],
    },
    scrapeStatus: partial.scrapeStatus ?? "ok",
  };
}

const CLEAR_POLICIES_AR = `
التوصيل خلال 3-5 أيام عمل.
إرجاع خلال 14 يومًا من الاستلام.
استبدال خلال 7 أيام مع الفاتورة.
`;

describe("score modules", () => {
  it("returns the shared module contract for all four pillars", () => {
    const p = page();
    for (const result of [
      scoreConversionModule(p),
      scoreSeoModule(p),
      scoreTrustModule(p),
      scoreGeoModule(p),
    ]) {
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.findings.length).toBeGreaterThan(0);
      expect(["low", "medium", "high"]).toContain(result.severity);
      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.findings.some((f) => /[\u0600-\u06FF]/.test(f))).toBe(true);
    }
  });

  it("is deterministic for the same page input", () => {
    const p = page();
    expect(scoreConversionModule(p)).toEqual(scoreConversionModule(p));
    expect(scoreSeoModule(p)).toEqual(scoreSeoModule(p));
    expect(scoreTrustModule(p)).toEqual(scoreTrustModule(p));
    expect(scoreGeoModule(p).score).toBe(scoreGeoModule(p).score);
  });

  it("scores a weak page lower than a rich page", () => {
    const rich = page();
    const weak = page({
      title: "",
      description: "",
      markdown: "buy",
      imageCount: 0,
      structuredData: {},
    });
    expect(scoreConversionModule(rich).score).toBeGreaterThan(scoreConversionModule(weak).score);
    expect(scoreSeoModule(rich).score).toBeGreaterThan(scoreSeoModule(weak).score);
    expect(scoreTrustModule(rich).score).toBeGreaterThan(scoreTrustModule(weak).score);
  });

  it("maps severity from score bands", () => {
    expect(severityFromScore(40)).toBe("high");
    expect(severityFromScore(60)).toBe("medium");
    expect(severityFromScore(80)).toBe("low");
  });
});

describe("local payment trust sub-check", () => {
  it("detects Mada, Tabby, Tamara, Apple Pay, and COD patterns", () => {
    const p = page({
      markdown:
        "ادفع بـ مدى أو Tabby أو تمارا. ندعم Apple Pay والدفع عند الاستلام.",
    });
    const d = detectLocalPaymentMethods(p);
    expect(d.detected).toEqual(
      expect.arrayContaining(["mada", "tabby", "tamara", "apple_pay", "cod"])
    );
    expect(d.detected).toHaveLength(5);
  });

  it("flags missing local payments as a high-severity Arabic Trust finding", () => {
    const trust = scoreTrustModule(page());
    expect(trust.findings[0]).toBe(TRUST_PAYMENT_MISSING_FINDING);
    expect(trust.severity).toBe("high");
    expect(trust.summary).toMatch(/طرق الدفع|دفع/);
  });

  it("raises trust when local payments are visible", () => {
    const without = scoreTrustModule(page());
    const withPay = scoreTrustModule(
      page({
        markdown: `# منتج\n\nادفع بـ مدى أو تابي. Apple Pay متاح.\n${CLEAR_POLICIES_AR}`,
      })
    );
    expect(withPay.score).toBeGreaterThan(without.score);
    expect(withPay.findings.some((f) => f.includes("مدى") || f.includes("تابي"))).toBe(true);
    expect(withPay.severity).not.toBe("high");
  });

  it("merges payment finding into Gemini trust payloads without double-counting score", () => {
    const base = {
      score: 70,
      findings: ["مراجعات جيدة"],
      severity: "medium" as const,
      summary: "ثقة متوسطة",
    };
    const enriched = enrichTrustWithLocalPayments(page(), base, { adjustScore: false });
    expect(enriched.score).toBe(70);
    expect(enriched.findings[0]).toBe(TRUST_PAYMENT_MISSING_FINDING);
    expect(enriched.severity).toBe("high");
  });
});

describe("shipping & returns clarity sub-check", () => {
  it("scores specific durations higher than vague or missing policies", () => {
    const specific = detectShippingReturnsClarity(
      page({
        markdown: CLEAR_POLICIES_AR,
      })
    );
    const vague = detectShippingReturnsClarity(
      page({
        markdown: "شحن سريع. سياسة الإرجاع متاحة. يمكن الاستبدال.",
      })
    );
    const missing = detectShippingReturnsClarity(page({ markdown: "منتج رائع للبشرة." }));

    expect(specific.shippingDuration).toBe("specific");
    expect(specific.returnPolicy).toBe("specific");
    expect(specific.exchangePolicy).toBe("specific");
    expect(specific.weakCount).toBe(0);

    expect(vague.shippingDuration).toBe("vague");
    expect(vague.returnPolicy).toBe("vague");
    expect(vague.exchangePolicy).toBe("vague");

    expect(missing.shippingDuration).toBe("missing");
    expect(missing.returnPolicy).toBe("missing");
    expect(missing.exchangePolicy).toBe("missing");
  });

  it("adds distinct Arabic shipping findings alongside payment findings", () => {
    const trust = scoreTrustModule(page({ markdown: "اشترِ الآن." }));
    expect(trust.findings[0]).toBe(TRUST_PAYMENT_MISSING_FINDING);
    expect(trust.findings.some((f) => f.includes("مدة الشحن"))).toBe(true);
    expect(trust.findings.some((f) => f.includes("سياسة الإرجاع"))).toBe(true);
    expect(trust.findings.some((f) => f.includes("سياسة الاستبدال"))).toBe(true);
  });

  it("improves trust score when shipping/returns are specific", () => {
    const weak = scoreTrustModule(page({ markdown: "اشترِ الآن مع مدى." }));
    const strong = scoreTrustModule(
      page({
        markdown: `اشترِ الآن مع مدى.\n${CLEAR_POLICIES_AR}`,
      })
    );
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.findings.some((f) => f.includes("واضحة ومحددة"))).toBe(true);
  });

  it("enriches Gemini payloads with shipping findings without changing anchored score", () => {
    const base = {
      score: 72,
      findings: ["مراجعات جيدة", TRUST_PAYMENT_MISSING_FINDING],
      severity: "medium" as const,
      summary: "ثقة متوسطة",
    };
    const enriched = enrichTrustSubChecks(page({ markdown: "اشترِ الآن." }), base, {
      adjustScore: false,
    });
    expect(enriched.score).toBe(72);
    expect(enriched.findings[0]).toBe(TRUST_PAYMENT_MISSING_FINDING);
    expect(enriched.findings.some((f) => f.includes("مدة الشحن"))).toBe(true);
    expect(enriched.severity).toBe("high");
  });
});
