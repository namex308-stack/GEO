import "server-only";
import type { CategoryResult, PageSnapshot, RuleResult } from "./types";
import { buildProfessionalSummary } from "./summary";

const BRAND_PATTERNS = /about|story|our story|mission|values|من نحن|قصتنا|مهمتنا/i;
const SOCIAL_HOSTS = /(facebook\.com|instagram\.com|tiktok\.com|x\.com|twitter\.com|linkedin\.com|youtube\.com)/i;

export function runBrandEngine(snapshot: PageSnapshot): CategoryResult {
  const rules: RuleResult[] = [];

  const hasAboutLink = snapshot.links.some((l) => BRAND_PATTERNS.test(l.text) || BRAND_PATTERNS.test(l.href));
  rules.push({
    id: "brand-about",
    label: "About / story page",
    passed: hasAboutLink,
    score: hasAboutLink ? 14 : 0,
    maxScore: 14,
    detail: hasAboutLink ? "Brand story/about link detected" : "No brand story/about link detected",
    category: "brand",
    confidence: 0.6,
    evidence: [],
  });

  const socialLinks = snapshot.links.filter((l) => SOCIAL_HOSTS.test(l.href));
  const hasSocial = socialLinks.length > 0;
  rules.push({
    id: "brand-social",
    label: "Social presence",
    passed: hasSocial,
    score: hasSocial ? 12 : 0,
    maxScore: 12,
    detail: hasSocial ? `${socialLinks.length} social link(s)` : "No social links detected",
    category: "brand",
    confidence: 0.65,
    evidence: socialLinks.slice(0, 3).map((l) => l.href),
  });

  const hasConsistentOg = snapshot.openGraphTitle.length > 0 && snapshot.hasOpenGraphImage;
  rules.push({
    id: "brand-og",
    label: "Brand share card",
    passed: hasConsistentOg,
    score: hasConsistentOg ? 10 : 0,
    maxScore: 10,
    detail: hasConsistentOg ? "OG title + image present" : "Missing OG title or image",
    category: "brand",
    confidence: 0.7,
    evidence: [],
  });

  const total = rules.reduce((s, r) => s + r.score, 0);
  const max = rules.reduce((s, r) => s + r.maxScore, 0);
  const score = Math.round((total / (max || 1)) * 100);

  const pseudoPillar = { pillar: "trust" as const, score, maxScore: 100, label: "Brand", summary: "", rules };
  const summary = buildProfessionalSummary(pseudoPillar);

  return { category: "brand", score, maxScore: 100, label: "Brand", summary, rules };
}

