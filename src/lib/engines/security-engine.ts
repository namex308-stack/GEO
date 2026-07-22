import "server-only";
import type { CategoryResult, PageSnapshot, RuleResult } from "./types";
import { buildProfessionalSummary } from "./summary";

export function runSecurityEngine(snapshot: PageSnapshot): CategoryResult {
  const rules: RuleResult[] = [];

  rules.push({
    id: "sec-https",
    label: "HTTPS",
    passed: snapshot.hasHttps,
    score: snapshot.hasHttps ? 20 : 0,
    maxScore: 20,
    detail: snapshot.hasHttps ? "Page uses HTTPS" : "No HTTPS",
    category: "security",
    confidence: 0.9,
    evidence: [],
  });

  const hasMixedContent = snapshot.hasHttps && /\bhttp:\/\//i.test(snapshot.html);
  rules.push({
    id: "sec-mixed-content",
    label: "Mixed content",
    passed: !hasMixedContent,
    score: !hasMixedContent ? 14 : 0,
    maxScore: 14,
    detail: !hasMixedContent ? "No http:// resources detected" : "http:// resources referenced on an HTTPS page",
    category: "security",
    confidence: 0.6,
    evidence: hasMixedContent ? ["Found http:// in HTML"] : [],
  });

  const hasCheckoutKeywords = /\b(checkout|payment|card|paypal|cash on delivery|cod)\b/i.test(snapshot.markdown);
  const hasSecurityKeywords = /\b(ssl|secure|security|encrypted|pci)\b/i.test(snapshot.markdown);
  const trustSignals = hasCheckoutKeywords || hasSecurityKeywords;
  rules.push({
    id: "sec-trust-signals",
    label: "Security trust signals",
    passed: trustSignals,
    score: trustSignals ? 10 : 0,
    maxScore: 10,
    detail: trustSignals ? "Checkout/security terms detected" : "No explicit security/payment trust cues detected",
    category: "security",
    confidence: 0.45,
    evidence: [],
  });

  const total = rules.reduce((s, r) => s + r.score, 0);
  const max = rules.reduce((s, r) => s + r.maxScore, 0);
  const score = Math.round((total / (max || 1)) * 100);

  const pseudoPillar = {
    pillar: "trust" as const,
    score,
    maxScore: 100,
    label: "Security",
    summary: "",
    rules,
  };
  const summary = buildProfessionalSummary(pseudoPillar);

  return { category: "security", score, maxScore: 100, label: "Security", summary, rules };
}

