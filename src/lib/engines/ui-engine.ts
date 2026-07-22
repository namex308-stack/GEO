import "server-only";
import type { CategoryResult, PageSnapshot, RuleResult } from "./types";
import { buildProfessionalSummary } from "./summary";

export function runUIEngine(snapshot: PageSnapshot): CategoryResult {
  const rules: RuleResult[] = [];
  const html = snapshot.html ?? "";

  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);
  rules.push({
    id: "ui-viewport",
    label: "Viewport meta",
    passed: hasViewport,
    score: hasViewport ? 12 : 0,
    maxScore: 12,
    detail: hasViewport ? "Viewport meta tag present" : "Missing viewport meta tag",
    category: "ui",
    confidence: 0.8,
    evidence: [],
  });

  const hasLazyLoading = /<img[^>]*\sloading=["']lazy["']/i.test(html);
  rules.push({
    id: "ui-lazy-images",
    label: "Lazy-loaded images",
    passed: hasLazyLoading,
    score: hasLazyLoading ? 10 : 0,
    maxScore: 10,
    detail: hasLazyLoading ? "At least one lazy image detected" : "No lazy-loaded images detected",
    category: "ui",
    confidence: 0.55,
    evidence: [],
  });

  const hasHero = /<h1[^>]*>[\s\S]{3,120}<\/h1>/i.test(html);
  rules.push({
    id: "ui-hero",
    label: "Clear hero header",
    passed: hasHero,
    score: hasHero ? 10 : 0,
    maxScore: 10,
    detail: hasHero ? "H1 detected" : "No clear H1 hero detected",
    category: "ui",
    confidence: 0.65,
    evidence: snapshot.h1?.slice(0, 2) ?? [],
  });

  const total = rules.reduce((s, r) => s + r.score, 0);
  const max = rules.reduce((s, r) => s + r.maxScore, 0);
  const score = Math.round((total / (max || 1)) * 100);

  const pseudoPillar = { pillar: "conversion" as const, score, maxScore: 100, label: "UI", summary: "", rules };
  const summary = buildProfessionalSummary(pseudoPillar);

  return { category: "ui", score, maxScore: 100, label: "UI", summary, rules };
}

