import "server-only";
import type { CategoryResult, PageSnapshot, RuleResult } from "./types";
import { buildProfessionalSummary } from "./summary";

export function runAccessibilityEngine(snapshot: PageSnapshot): CategoryResult {
  const rules: RuleResult[] = [];

  const imgAlts = (snapshot.html.match(/<img[^>]*alt=["'][^"']+["']/gi) || []).length;
  const altRatio = snapshot.images > 0 ? imgAlts / snapshot.images : 1;
  const altOk = altRatio >= 0.8;

  rules.push({
    id: "a11y-img-alt",
    label: "Image alt coverage",
    passed: altOk,
    score: altOk ? 20 : altRatio > 0 ? 10 : 0,
    maxScore: 20,
    detail: `${imgAlts}/${snapshot.images} images have alt text`,
    category: "accessibility",
    confidence: 0.7,
    evidence: [`altRatio=${altRatio.toFixed(2)}`],
  });

  const hasH1 = (snapshot.h1 ?? []).length > 0;
  rules.push({
    id: "a11y-h1",
    label: "Single clear H1",
    passed: hasH1,
    score: hasH1 ? 12 : 0,
    maxScore: 12,
    detail: hasH1 ? `H1 count: ${snapshot.h1.length}` : "No H1 detected",
    category: "accessibility",
    confidence: 0.65,
    evidence: snapshot.h1?.slice(0, 2) ?? [],
  });

  const hasLangAttr = /<html[^>]*\slang=["'][^"']+["']/i.test(snapshot.html);
  rules.push({
    id: "a11y-lang",
    label: "Document language",
    passed: hasLangAttr,
    score: hasLangAttr ? 10 : 0,
    maxScore: 10,
    detail: hasLangAttr ? "lang attribute set on <html>" : "Missing lang attribute on <html>",
    category: "accessibility",
    confidence: 0.75,
    evidence: [],
  });

  const total = rules.reduce((s, r) => s + r.score, 0);
  const max = rules.reduce((s, r) => s + r.maxScore, 0);
  const score = Math.round((total / (max || 1)) * 100);

  const pseudoPillar = {
    pillar: "trust" as const,
    score,
    maxScore: 100,
    label: "Accessibility",
    summary: "",
    rules,
  };
  const summary = buildProfessionalSummary(pseudoPillar);

  return { category: "accessibility", score, maxScore: 100, label: "Accessibility", summary, rules };
}

