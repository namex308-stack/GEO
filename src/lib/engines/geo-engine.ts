import type { PageSnapshot, EngineResult, RuleResult } from "./types";

import { buildProfessionalSummary } from "./summary";



export function runGEOEngine(snapshot: PageSnapshot): EngineResult {

  const rules: RuleResult[] = [];

  const md = snapshot.markdown;

  const html = snapshot.html;



  const faqSchemaType = snapshot.schemaOrg.some((s) => s["@type"] === "FAQPage");

  const hasFaqSection = /FAQ|frequently asked|أسئلة شائعة|<summary/i.test(md);

  const questionMarks = (md.match(/\?/g) || []).length;

  const faqScore = faqSchemaType ? 18 : hasFaqSection && questionMarks >= 3 ? 14 : questionMarks >= 2 ? 9 : questionMarks >= 1 ? 4 : 0;

  rules.push({

    id: "geo-faq",

    label: "FAQ coverage",

    passed: faqScore >= 14,

    score: faqScore,

    maxScore: 18,

    detail: faqSchemaType ? "FAQPage schema found" : `${questionMarks} question(s) detected`,

  });



  const schemaCount = snapshot.schemaOrg.length;

  const schemaScore = schemaCount >= 3 ? 14 : schemaCount >= 2 ? 10 : schemaCount >= 1 ? 6 : 0;

  rules.push({

    id: "geo-schema",

    label: "Schema markup",

    passed: schemaScore >= 10,

    score: schemaScore,

    maxScore: 14,

    detail: `${schemaCount} JSON-LD block(s)`,

  });



  const hasProductSchema = snapshot.schemaOrg.some((s) => s["@type"] === "Product");

  rules.push({

    id: "geo-product-schema",

    label: "Product structured data",

    passed: hasProductSchema,

    score: hasProductSchema ? 14 : 0,

    maxScore: 14,

    detail: hasProductSchema ? "Product schema found" : "No Product structured data",

  });



  const h1Clear = snapshot.h1.length > 0 && snapshot.h1[0].length >= 10;

  const entityScore = hasProductSchema && h1Clear ? 12 : hasProductSchema || h1Clear ? 8 : 0;

  rules.push({

    id: "geo-entity",

    label: "Entity recognition",

    passed: entityScore >= 8,

    score: entityScore,

    maxScore: 12,

    detail: hasProductSchema ? "Product entity well-defined" : "Entity needs clearer definition",

  });



  const sentences = md.split(/[.!؟。]\s/).filter((s) => s.length >= 40 && s.length <= 200);

  const quotableScore = sentences.length >= 5 ? 12 : sentences.length >= 3 ? 8 : sentences.length >= 1 ? 4 : 0;

  rules.push({

    id: "geo-quotable",

    label: "AI-suitable content",

    passed: quotableScore >= 8,

    score: quotableScore,

    maxScore: 12,

    detail: `${sentences.length} quotable sentence(s) for AI engines`,

  });



  const citationPatterns = /according to|research|study|certified|award|cooperative|مصدر|معتمد|شهادة/i;

  const hasCitationSignals = citationPatterns.test(md) || snapshot.links.length >= 5;

  rules.push({

    id: "geo-citation",

    label: "Citation readiness",

    passed: hasCitationSignals,

    score: hasCitationSignals ? 10 : 0,

    maxScore: 10,

    detail: hasCitationSignals ? "Authority & citation signals present" : "Add sources and trust cues for AI citation",

  });



  const bulletCount = (md.match(/^[-*•]\s/gm) || []).length + (html.match(/<li/gi) || []).length;

  const words = md.split(/\s+/).length;

  const readinessScore = Math.min(

    20,

    Math.round(faqScore * 0.3 + schemaScore * 0.25 + quotableScore * 0.25 + (words >= 200 ? 8 : 4))

  );

  rules.push({

    id: "geo-ai-readiness",

    label: "AI readiness score",

    passed: readinessScore >= 14,

    score: readinessScore,

    maxScore: 20,

    detail: `Composite readiness: FAQ ${faqScore}/18, schema ${schemaScore}/14, lists ${bulletCount}, depth ${words}w`,

  });



  const total = rules.reduce((s, r) => s + r.score, 0);

  const max = rules.reduce((s, r) => s + r.maxScore, 0);

  const score = Math.round((total / max) * 100);



  const result: EngineResult = {

    pillar: "geo",

    score,

    maxScore: 100,

    label: "GEO / AI Visibility",

    summary: "",

    rules,

  };

  result.summary = buildProfessionalSummary(result);

  return result;

}


