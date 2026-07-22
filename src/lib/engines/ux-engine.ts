import "server-only";
import type { CategoryResult, PageSnapshot, RuleResult } from "./types";
import { buildProfessionalSummary } from "./summary";

export function runUXEngine(snapshot: PageSnapshot): CategoryResult {
  const rules: RuleResult[] = [];
  const html = snapshot.html ?? "";

  const hasSearch = /type=["']search["']|name=["']q["']|placeholder=["'][^"']*(search|بحث)[^"']*["']/i.test(html);
  rules.push({
    id: "ux-search",
    label: "On-site search",
    passed: hasSearch,
    score: hasSearch ? 12 : 0,
    maxScore: 12,
    detail: hasSearch ? "Search UI detected" : "No search UI detected",
    category: "ux",
    confidence: 0.55,
    evidence: [],
  });

  const navLinks = (html.match(/<a\s+[^>]*href=["'][^"']+["'][^>]*>/gi) || []).length;
  const navOk = navLinks >= 20 || snapshot.internalLinkCount >= 10;
  rules.push({
    id: "ux-navigation",
    label: "Navigation density",
    passed: navOk,
    score: navOk ? 14 : navLinks >= 10 ? 7 : 0,
    maxScore: 14,
    detail: `links: ${Math.max(navLinks, snapshot.internalLinkCount)}`,
    category: "ux",
    confidence: 0.5,
    evidence: [],
  });

  const hasBreadcrumbs = /\bbreadcrumb\b/i.test(html) || /aria-label=["'][^"']*breadcrumb/i.test(html);
  rules.push({
    id: "ux-breadcrumbs",
    label: "Breadcrumbs",
    passed: hasBreadcrumbs,
    score: hasBreadcrumbs ? 8 : 0,
    maxScore: 8,
    detail: hasBreadcrumbs ? "Breadcrumbs detected" : "No breadcrumbs detected",
    category: "ux",
    confidence: 0.45,
    evidence: [],
  });

  const total = rules.reduce((s, r) => s + r.score, 0);
  const max = rules.reduce((s, r) => s + r.maxScore, 0);
  const score = Math.round((total / (max || 1)) * 100);

  const pseudoPillar = { pillar: "conversion" as const, score, maxScore: 100, label: "UX", summary: "", rules };
  const summary = buildProfessionalSummary(pseudoPillar);

  return { category: "ux", score, maxScore: 100, label: "UX", summary, rules };
}

