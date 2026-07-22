import type { PageSnapshot, EngineResult, RuleResult } from "./types";

import { buildProfessionalSummary } from "./summary";



const CONTACT_PATTERNS = /contact|email|phone|whatsapp|support|help|تواصل|اتصل|واتساب|دعم/i;

const REVIEW_PATTERNS = /review|rating|star|★|⭐|تقييم|نجمة/i;



function linkMatches(links: PageSnapshot["links"], pattern: RegExp): boolean {

  return links.some((l) => pattern.test(l.text) || pattern.test(l.href));

}



export function runTrustEngine(snapshot: PageSnapshot): EngineResult {

  const rules: RuleResult[] = [];

  const md = snapshot.markdown.toLowerCase();

  const html = snapshot.html.toLowerCase();



  rules.push({

    id: "trust-https",

    label: "SSL / HTTPS",

    passed: snapshot.hasHttps,

    score: snapshot.hasHttps ? 15 : 0,

    maxScore: 15,

    detail: snapshot.hasHttps ? "Secure HTTPS connection" : "No HTTPS",

  });



  const hasPrivacy = /privacy|سياسة الخصوصية/i.test(md) || linkMatches(snapshot.links, /privacy/i);

  rules.push({

    id: "trust-privacy",

    label: "Privacy policy",

    passed: hasPrivacy,

    score: hasPrivacy ? 12 : 0,

    maxScore: 12,

    detail: hasPrivacy ? "Privacy policy referenced" : "No privacy policy found",

  });



  const hasTerms = /terms|conditions|شروط/i.test(md) || linkMatches(snapshot.links, /terms|conditions/i);

  rules.push({

    id: "trust-terms",

    label: "Terms of service",

    passed: hasTerms,

    score: hasTerms ? 12 : 0,

    maxScore: 12,

    detail: hasTerms ? "Terms of service referenced" : "No terms page found",

  });



  const hasRefund = /refund|return policy|money back|استرداد|سياسة الإرجاع/i.test(md) || linkMatches(snapshot.links, /refund|return/i);

  rules.push({

    id: "trust-refund",

    label: "Refund policy",

    passed: hasRefund,

    score: hasRefund ? 12 : 0,

    maxScore: 12,

    detail: hasRefund ? "Refund/returns policy found" : "No refund policy detected",

  });



  const hasEmail = /[\w.-]+@[\w.-]+\.\w{2,}/.test(md);

  const hasPhone = /(\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/.test(md);

  const hasContact = CONTACT_PATTERNS.test(md) || hasEmail || hasPhone;

  rules.push({

    id: "trust-contact",

    label: "Contact information",

    passed: hasContact,

    score: hasContact ? 12 : 0,

    maxScore: 12,

    detail: hasEmail ? "Email found" : hasPhone ? "Phone found" : hasContact ? "Contact section found" : "No contact info",

  });



  const hasAbout = /about us|about our|من نحن|our story|our mission/i.test(md) || linkMatches(snapshot.links, /about/i);

  rules.push({

    id: "trust-about",

    label: "About page",

    passed: hasAbout,

    score: hasAbout ? 10 : 0,

    maxScore: 10,

    detail: hasAbout ? "About page or section found" : "No about page detected",

  });



  const hasReviewSchema = snapshot.schemaOrg.some(

    (s) =>

      s["@type"] === "Review" ||

      s["@type"] === "AggregateRating" ||

      (s as Record<string, unknown>).aggregateRating != null

  );

  const hasReviewText = REVIEW_PATTERNS.test(md);

  const reviewScore = hasReviewSchema ? 12 : hasReviewText ? 8 : 0;

  rules.push({

    id: "trust-reviews",

    label: "Trust signals & reviews",

    passed: reviewScore >= 8,

    score: reviewScore,

    maxScore: 12,

    detail: hasReviewSchema ? "Review schema found" : hasReviewText ? "Review mentions found" : "No reviews",

  });



  const trustBadges = /ssl|verified|certified|secure|badge|trusted|norton|mcafee|comodo|safe|آمن|موثوق/i;

  const hasBadges = trustBadges.test(html);

  rules.push({

    id: "trust-badges",

    label: "Basic trust badges",

    passed: hasBadges,

    score: hasBadges ? 15 : 0,

    maxScore: 15,

    detail: hasBadges ? "Trust badges detected" : "No trust badges detected",

  });



  const total = rules.reduce((s, r) => s + r.score, 0);

  const max = rules.reduce((s, r) => s + r.maxScore, 0);

  const score = Math.round((total / max) * 100);



  const result: EngineResult = {

    pillar: "trust",

    score,

    maxScore: 100,

    label: "Trust",

    summary: "",

    rules,

  };

  result.summary = buildProfessionalSummary(result);

  return result;

}


