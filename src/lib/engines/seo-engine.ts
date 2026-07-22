import type { PageSnapshot, EngineResult, RuleResult } from "./types";

import { buildProfessionalSummary } from "./summary";



export function runSEOEngine(snapshot: PageSnapshot): EngineResult {

  const rules: RuleResult[] = [];



  const titleLen = snapshot.title.length;

  const titleOk = titleLen >= 30 && titleLen <= 70;

  rules.push({

    id: "seo-title-len",

    label: "Meta title",

    passed: titleOk,

    score: titleOk ? 12 : titleLen > 0 ? 6 : 0,

    maxScore: 12,

    detail: `${titleLen} chars (ideal: 30–70)`,

  });



  const descLen = snapshot.metaDescription.length;

  const descOk = descLen >= 70 && descLen <= 160;

  rules.push({

    id: "seo-desc-len",

    label: "Meta description",

    passed: descOk,

    score: descOk ? 12 : descLen > 0 ? 6 : 0,

    maxScore: 12,

    detail: `${descLen} chars (ideal: 70–160)`,

  });



  const hasH1 = snapshot.h1.length > 0;

  const singleH1 = snapshot.h1.length === 1;

  rules.push({

    id: "seo-h1",

    label: "H1 heading",

    passed: hasH1,

    score: singleH1 ? 10 : hasH1 ? 7 : 0,

    maxScore: 10,

    detail: `${snapshot.h1.length} H1 tag(s)`,

  });



  const h2Count = snapshot.headings.filter((h) => h.level === 2).length;

  const hierarchyOk = hasH1 && h2Count >= 1;

  rules.push({

    id: "seo-hierarchy",

    label: "Heading hierarchy",

    passed: hierarchyOk,

    score: hierarchyOk ? 8 : h2Count > 0 ? 4 : 0,

    maxScore: 8,

    detail: `${h2Count} H2 subheading(s)`,

  });



  const internalOk = snapshot.internalLinkCount >= 3;

  rules.push({

    id: "seo-internal-links",

    label: "Internal links",

    passed: internalOk,

    score: internalOk ? 10 : snapshot.internalLinkCount >= 1 ? 5 : 0,

    maxScore: 10,

    detail: `${snapshot.internalLinkCount} internal link(s)`,

  });



  rules.push({

    id: "seo-canonical",

    label: "Canonical link",

    passed: snapshot.hasCanonical,

    score: snapshot.hasCanonical ? 8 : 0,

    maxScore: 8,

    detail: snapshot.hasCanonical ? "Canonical tag present" : "No canonical tag",

  });



  rules.push({

    id: "seo-robots",

    label: "Robots.txt",

    passed: snapshot.siteHasRobotsTxt,

    score: snapshot.siteHasRobotsTxt ? 8 : 0,

    maxScore: 8,

    detail: snapshot.siteHasRobotsTxt ? "robots.txt found" : "No robots.txt detected",

  });



  rules.push({

    id: "seo-sitemap",

    label: "Sitemap",

    passed: snapshot.siteHasSitemap,

    score: snapshot.siteHasSitemap ? 8 : 0,

    maxScore: 8,

    detail: snapshot.siteHasSitemap ? "sitemap.xml found" : "No sitemap detected",

  });



  const imgAlts = (snapshot.html.match(/<img[^>]*alt=["'][^"']+["']/gi) || []).length;

  const altRatio = snapshot.images > 0 ? imgAlts / snapshot.images : 1;

  const altOk = altRatio >= 0.8;

  rules.push({

    id: "seo-img-alt",

    label: "Images & alt text",

    passed: altOk,

    score: altOk ? 10 : altRatio > 0 ? 5 : 0,

    maxScore: 10,

    detail: `${imgAlts}/${snapshot.images} images have alt text`,

  });



  const ogOk =

    (snapshot.openGraphTitle.length > 0 || snapshot.openGraphDescription.length > 0) &&

    snapshot.hasOpenGraphImage;

  const ogPartial = snapshot.openGraphTitle.length > 0 || snapshot.openGraphDescription.length > 0;

  rules.push({

    id: "seo-og",

    label: "Open Graph tags",

    passed: ogOk,

    score: ogOk ? 10 : ogPartial ? 5 : 0,

    maxScore: 10,

    detail: ogOk ? "OG title, description & image" : ogPartial ? "Partial OG tags" : "No Open Graph tags",

  });

  const total = rules.reduce((s, r) => s + r.score, 0);

  const max = rules.reduce((s, r) => s + r.maxScore, 0);

  const score = Math.round((total / max) * 100);



  const result: EngineResult = {

    pillar: "seo",

    score,

    maxScore: 100,

    label: "SEO",

    summary: "",

    rules,

  };

  result.summary = buildProfessionalSummary(result);

  return result;

}


