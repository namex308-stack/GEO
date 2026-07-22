import "server-only";
import type { CategoryResult, PageSnapshot, RuleResult } from "./types";
import { buildProfessionalSummary } from "./summary";

const CART_PATTERNS = /add to cart|cart|basket|buy now|checkout|أضف للسلة|السلة|اشتر/i;

export function runEcommerceEngine(snapshot: PageSnapshot): CategoryResult {
  const rules: RuleResult[] = [];
  const md = snapshot.markdown ?? "";
  const html = snapshot.html ?? "";

  const hasCartFlow = CART_PATTERNS.test(html) || CART_PATTERNS.test(md);
  rules.push({
    id: "ecom-cart-flow",
    label: "Cart / checkout flow",
    passed: hasCartFlow,
    score: hasCartFlow ? 18 : 0,
    maxScore: 18,
    detail: hasCartFlow ? "Cart/checkout cues detected" : "No cart/checkout cues detected",
    category: "ecommerce",
    confidence: 0.6,
    evidence: [],
  });

  const hasVariants = /<select[^>]*name=["'][^"']*(variant|option|size|color)[^"']*["']/i.test(html) || /\b(size|color|variant|مقاس|لون)\b/i.test(md);
  rules.push({
    id: "ecom-variants",
    label: "Variants / options",
    passed: hasVariants,
    score: hasVariants ? 12 : 0,
    maxScore: 12,
    detail: hasVariants ? "Variant selection cues detected" : "No variant selection cues detected",
    category: "ecommerce",
    confidence: 0.45,
    evidence: [],
  });

  const hasPrice = /\$[\d,.]+|[\d,.]+\s*(EGP|ج\.م|SAR|AED|USD|EUR|£)/i.test(md) || /itemprop=["']price/i.test(html);
  rules.push({
    id: "ecom-price",
    label: "Price presence",
    passed: hasPrice,
    score: hasPrice ? 14 : 0,
    maxScore: 14,
    detail: hasPrice ? "Price detected" : "No price detected",
    category: "ecommerce",
    confidence: 0.7,
    evidence: [],
  });

  const total = rules.reduce((s, r) => s + r.score, 0);
  const max = rules.reduce((s, r) => s + r.maxScore, 0);
  const score = Math.round((total / (max || 1)) * 100);

  const pseudoPillar = { pillar: "conversion" as const, score, maxScore: 100, label: "Ecommerce", summary: "", rules };
  const summary = buildProfessionalSummary(pseudoPillar);

  return { category: "ecommerce", score, maxScore: 100, label: "Ecommerce", summary, rules };
}

