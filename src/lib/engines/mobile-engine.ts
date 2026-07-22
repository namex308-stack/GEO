import "server-only";
import type { CategoryResult, PageSnapshot, RuleResult } from "./types";
import { buildProfessionalSummary } from "./summary";

export function runMobileEngine(snapshot: PageSnapshot): CategoryResult {
  const rules: RuleResult[] = [];
  const html = snapshot.html ?? "";

  rules.push({
    id: "mobile-viewport",
    label: "Mobile viewport",
    passed: snapshot.hasViewportMeta,
    score: snapshot.hasViewportMeta ? 18 : 0,
    maxScore: 18,
    detail: snapshot.hasViewportMeta ? "Viewport meta tag present" : "Missing viewport meta tag",
    category: "mobile",
    confidence: 0.85,
    evidence: [],
  });

  const hasResponsiveImages = /\ssrcset=["'][^"']+["']/i.test(html) || /\ssizes=["'][^"']+["']/i.test(html);
  rules.push({
    id: "mobile-responsive-images",
    label: "Responsive images",
    passed: hasResponsiveImages,
    score: hasResponsiveImages ? 10 : 0,
    maxScore: 10,
    detail: hasResponsiveImages ? "srcset/sizes detected" : "No responsive image hints detected",
    category: "mobile",
    confidence: 0.55,
    evidence: [],
  });

  const hasStickyCta = /position:\s*fixed/i.test(html) && /add to cart|buy now|أضف للسلة|اشتر/i.test(html);
  rules.push({
    id: "mobile-sticky-cta",
    label: "Mobile CTA ergonomics",
    passed: hasStickyCta,
    score: hasStickyCta ? 8 : 0,
    maxScore: 8,
    detail: hasStickyCta ? "Potential sticky CTA detected" : "No sticky CTA detected",
    category: "mobile",
    confidence: 0.35,
    evidence: [],
  });

  const total = rules.reduce((s, r) => s + r.score, 0);
  const max = rules.reduce((s, r) => s + r.maxScore, 0);
  const score = Math.round((total / (max || 1)) * 100);

  const pseudoPillar = { pillar: "conversion" as const, score, maxScore: 100, label: "Mobile", summary: "", rules };
  const summary = buildProfessionalSummary(pseudoPillar);

  return { category: "mobile", score, maxScore: 100, label: "Mobile", summary, rules };
}

