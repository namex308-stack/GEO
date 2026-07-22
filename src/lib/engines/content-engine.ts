import "server-only";
import type { CategoryResult, PageSnapshot, RuleResult } from "./types";
import { buildProfessionalSummary } from "./summary";

export function runContentEngine(snapshot: PageSnapshot): CategoryResult {
  const rules: RuleResult[] = [];
  const md = (snapshot.markdown ?? "").trim();

  const wordCount = md ? md.split(/\s+/).length : 0;
  const okDepth = wordCount >= 300;
  rules.push({
    id: "content-depth",
    label: "Content depth",
    passed: okDepth,
    score: okDepth ? 18 : wordCount >= 150 ? 9 : wordCount >= 60 ? 4 : 0,
    maxScore: 18,
    detail: `~${wordCount} words`,
    category: "content",
    confidence: 0.7,
    evidence: [`wordCount=${wordCount}`],
  });

  const hasBullets = /(^|\n)\s*[-*]\s+\S+/m.test(md);
  rules.push({
    id: "content-bullets",
    label: "Scannable bullets",
    passed: hasBullets,
    score: hasBullets ? 10 : 0,
    maxScore: 10,
    detail: hasBullets ? "Bullet list detected" : "No bullet list detected",
    category: "content",
    confidence: 0.6,
    evidence: [],
  });

  const hasFaq = /\bfaq\b/i.test(md) || /question|answer|سؤال|إجابة/i.test(md);
  rules.push({
    id: "content-faq",
    label: "FAQ / objection handling",
    passed: hasFaq,
    score: hasFaq ? 12 : 0,
    maxScore: 12,
    detail: hasFaq ? "FAQ-like structure detected" : "No FAQ / Q&A detected",
    category: "content",
    confidence: 0.4,
    evidence: [],
  });

  const total = rules.reduce((s, r) => s + r.score, 0);
  const max = rules.reduce((s, r) => s + r.maxScore, 0);
  const score = Math.round((total / (max || 1)) * 100);

  const pseudoPillar = { pillar: "seo" as const, score, maxScore: 100, label: "Content", summary: "", rules };
  const summary = buildProfessionalSummary(pseudoPillar);

  return { category: "content", score, maxScore: 100, label: "Content", summary, rules };
}

