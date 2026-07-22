import type { PageSnapshot, EngineResult, RuleResult } from "./types";
import { buildProfessionalSummary } from "./summary";

const CTA_PATTERNS = /buy|add to cart|shop|order|get|subscribe|try|start|sign up|checkout|purchase|اشتري|أضف للسلة|اطلب|احصل|اشترك/i;
const BENEFIT_PATTERNS = /free shipping|guarantee|warranty|return|money back|satisfaction|risk.?free|secure|شحن مجاني|ضمان|إرجاع|استرداد/i;
const SOCIAL_PROOF = /review|rating|star|testimonial|customer|sold|trusted|تقييم|نجمة|عميل|موثوق/i;

export function runCROEngine(snapshot: PageSnapshot): EngineResult {
  const rules: RuleResult[] = [];
  const md = snapshot.markdown.toLowerCase();
  const html = snapshot.html.toLowerCase();

  // 1. CTA visibility (0-20)
  const ctaInHtml = CTA_PATTERNS.test(html);
  const ctaButtons = (html.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [])
    .filter((b) => CTA_PATTERNS.test(b));
  const ctaScore = ctaButtons.length >= 2 ? 20 : ctaButtons.length === 1 ? 14 : ctaInHtml ? 8 : 0;
  rules.push({ id: "cro-cta", label: "CTA visibility", passed: ctaScore >= 14, score: ctaScore, maxScore: 20, detail: `${ctaButtons.length} CTA button(s) found` });

  // 2. Price presence (0-15)
  const hasPrice = /\$[\d,.]+|[\d,.]+\s*(EGP|ج\.م|SAR|AED|USD|EUR|£)/i.test(snapshot.markdown) || /itemprop=["']price/i.test(html);
  rules.push({ id: "cro-price", label: "Price clearly displayed", passed: hasPrice, score: hasPrice ? 15 : 0, maxScore: 15, detail: hasPrice ? "Price found on page" : "No clear price detected" });

  // 3. Image count (0-15)
  const imgScore = snapshot.images >= 4 ? 15 : snapshot.images >= 2 ? 10 : snapshot.images >= 1 ? 5 : 0;
  rules.push({ id: "cro-images", label: "Product images", passed: imgScore >= 10, score: imgScore, maxScore: 15, detail: `${snapshot.images} image(s) on page` });

  // 4. Benefit-oriented language (0-15)
  const benefitMatches = md.match(new RegExp(BENEFIT_PATTERNS.source, "gi")) || [];
  const benefitScore = benefitMatches.length >= 3 ? 15 : benefitMatches.length >= 1 ? 10 : 0;
  rules.push({ id: "cro-benefits", label: "Benefit language", passed: benefitScore >= 10, score: benefitScore, maxScore: 15, detail: `${benefitMatches.length} benefit signal(s)` });

  // 5. Social proof signals (0-15)
  const socialMatches = md.match(new RegExp(SOCIAL_PROOF.source, "gi")) || [];
  const socialScore = socialMatches.length >= 3 ? 15 : socialMatches.length >= 1 ? 10 : 0;
  rules.push({ id: "cro-social", label: "Social proof", passed: socialScore >= 10, score: socialScore, maxScore: 15, detail: `${socialMatches.length} social proof signal(s)` });

  // 6. Page length / content depth (0-10)
  const wordCount = md.split(/\s+/).length;
  const depthScore = wordCount >= 300 ? 10 : wordCount >= 150 ? 7 : wordCount >= 50 ? 4 : 0;
  rules.push({ id: "cro-depth", label: "Content depth", passed: depthScore >= 7, score: depthScore, maxScore: 10, detail: `~${wordCount} words` });

  // 7. Payment method signals (0-10)
  const paymentMethods = /visa|mastercard|meeza|paypal|apple pay|google pay|vodafone|instapay|cash on delivery|الدفع|بطاقة/i;
  const hasPayments = paymentMethods.test(html) || paymentMethods.test(md);
  rules.push({ id: "cro-payments", label: "Payment methods shown", passed: hasPayments, score: hasPayments ? 10 : 0, maxScore: 10, detail: hasPayments ? "Payment options visible" : "No payment method badges detected" });

  // 8. Urgency/scarcity (0-5)
  const urgency = /limited|hurry|only \d|last chance|exclusive|محدود|عرض خاص|آخر/i.test(md);
  rules.push({ id: "cro-urgency", label: "Urgency/scarcity cues", passed: urgency, score: urgency ? 5 : 0, maxScore: 5, detail: urgency ? "Urgency language detected" : "No urgency cues found" });

  // 9. Shipping & delivery clarity (0-5)
  const shipping = /shipping|delivery|returns|refund|شحن|توصيل|إرجاع|استرداد/i.test(md) || /shipping|delivery|returns|refund/i.test(html);
  rules.push({
    id: "cro-shipping",
    label: "Shipping & delivery clarity",
    passed: shipping,
    score: shipping ? 5 : 0,
    maxScore: 5,
    detail: shipping ? "Shipping/delivery signals detected" : "No shipping/delivery info detected",
  });

  const total = rules.reduce((s, r) => s + r.score, 0);
  const max = rules.reduce((s, r) => s + r.maxScore, 0);
  const score = Math.round((total / max) * 100);

  const result: EngineResult = {
    pillar: "conversion",
    score,
    maxScore: 100,
    label: "Conversion",
    summary: "",
    rules,
  };
  result.summary = buildProfessionalSummary(result);
  return result;
}
