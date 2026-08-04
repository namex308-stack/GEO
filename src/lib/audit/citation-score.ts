/**
 * Deterministic citation / GEO component scoring.
 * Each function returns 0–max points; aggregate via sumComponentScores.
 */

import type { StructuredContentSignals } from "@/lib/audit/structured-content";

/** Max points per GEO component (sums to 100). */
export const GEO_COMPONENT_MAX = {
  faq: 15,
  productSchema: 12,
  organizationSchema: 8,
  breadcrumbSchema: 8,
  headings: 10,
  contentStructure: 12,
  internalLinks: 10,
  entityRichness: 10,
  metadata: 8,
  contentClarity: 7,
} as const;

export type GeoComponentKey = keyof typeof GEO_COMPONENT_MAX;

export type GeoComponentScores = Record<GeoComponentKey, number>;

export function scoreFaqAvailability(signals: StructuredContentSignals): number {
  const max = GEO_COMPONENT_MAX.faq;
  if (!signals.hasFaq && !signals.hasFaqSchema) return 0;
  let pts = 0;
  if (signals.hasFaqSchema) pts += 6;
  if (signals.faqCount >= 1) pts += 4;
  if (signals.faqCount >= 3) pts += 3;
  if (signals.faqCount >= 5) pts += 2;
  if (signals.hasFaq && !signals.hasFaqSchema && signals.faqCount === 0) pts += 4;
  return clampPoints(pts, max);
}

export function scoreProductSchema(signals: StructuredContentSignals): number {
  return signals.hasProductSchema ? GEO_COMPONENT_MAX.productSchema : 0;
}

export function scoreOrganizationSchema(signals: StructuredContentSignals): number {
  return signals.hasOrganizationSchema ? GEO_COMPONENT_MAX.organizationSchema : 0;
}

export function scoreBreadcrumbSchema(signals: StructuredContentSignals): number {
  return signals.hasBreadcrumbSchema ? GEO_COMPONENT_MAX.breadcrumbSchema : 0;
}

export function scoreStructuredHeadings(signals: StructuredContentSignals): number {
  const max = GEO_COMPONENT_MAX.headings;
  if (signals.headingCount <= 0 && !signals.hasH1LikeHeading) return 0;
  const depthPts = Math.round(signals.headingDepthScore * 6);
  let countPts = 0;
  if (signals.headingCount >= 1) countPts += 2;
  if (signals.headingCount >= 3) countPts += 1;
  if (signals.headingCount >= 5) countPts += 1;
  return clampPoints(depthPts + countPts, max);
}

export function scoreContentStructure(signals: StructuredContentSignals): number {
  const max = GEO_COMPONENT_MAX.contentStructure;
  let pts = 0;
  if (signals.wordCount >= 150) pts += 3;
  if (signals.wordCount >= 400) pts += 2;
  if (signals.wordCount >= 800) pts += 2;
  if (signals.paragraphCount >= 2) pts += 2;
  if (signals.listItemCount >= 3) pts += 2;
  if (signals.hasQuestionPatterns) pts += 1;
  return clampPoints(pts, max);
}

export function scoreInternalLinks(signals: StructuredContentSignals): number {
  const max = GEO_COMPONENT_MAX.internalLinks;
  const n = signals.internalLinkCount;
  if (n <= 0) return 0;
  let pts = 3;
  if (n >= 2) pts += 3;
  if (n >= 4) pts += 2;
  if (n >= 6) pts += 2;
  // Penalize link farms: too many external vs internal
  if (signals.externalLinkCount > signals.internalLinkCount * 3 && n < 2) pts = Math.min(pts, 2);
  return clampPoints(pts, max);
}

export function scoreEntityRichness(signals: StructuredContentSignals): number {
  const max = GEO_COMPONENT_MAX.entityRichness;
  let pts = 0;
  if (signals.hasProductName) pts += 3;
  if (signals.hasBrand) pts += 3;
  if (signals.hasPrice) pts += 2;
  if (signals.hasCategoryHint) pts += 2;
  return clampPoints(pts, max);
}

export function scoreMetadataCompleteness(signals: StructuredContentSignals): number {
  const max = GEO_COMPONENT_MAX.metadata;
  let pts = 0;
  if (signals.hasTitle) pts += 2;
  if (signals.hasDescription && signals.descriptionLength >= 50) pts += 2;
  else if (signals.hasDescription) pts += 1;
  if (signals.hasOgTitle) pts += 1;
  if (signals.hasOgDescription) pts += 1;
  if (signals.hasOgImage) pts += 2;
  return clampPoints(pts, max);
}

export function scoreContentClarity(signals: StructuredContentSignals): number {
  const max = GEO_COMPONENT_MAX.contentClarity;
  let pts = 0;
  if (signals.hasBenefitStatement) pts += 3;
  if (signals.descriptionLength >= 80) pts += 2;
  // Prefer readable sentence length (8–28 words)
  const avg = signals.avgSentenceLength;
  if (avg >= 8 && avg <= 28) pts += 2;
  else if (avg > 0 && avg < 40) pts += 1;
  return clampPoints(pts, max);
}

/** Score all GEO components from structured-content signals. */
export function scoreAllGeoComponents(signals: StructuredContentSignals): GeoComponentScores {
  return {
    faq: scoreFaqAvailability(signals),
    productSchema: scoreProductSchema(signals),
    organizationSchema: scoreOrganizationSchema(signals),
    breadcrumbSchema: scoreBreadcrumbSchema(signals),
    headings: scoreStructuredHeadings(signals),
    contentStructure: scoreContentStructure(signals),
    internalLinks: scoreInternalLinks(signals),
    entityRichness: scoreEntityRichness(signals),
    metadata: scoreMetadataCompleteness(signals),
    contentClarity: scoreContentClarity(signals),
  };
}

/** Sum component scores into a 0–100 citation / GEO score. */
export function sumComponentScores(components: GeoComponentScores): number {
  let total = 0;
  for (const key of Object.keys(GEO_COMPONENT_MAX) as GeoComponentKey[]) {
    total += components[key] ?? 0;
  }
  return clampPoints(total, 100);
}

function clampPoints(n: number, max: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, Math.round(n)));
}
