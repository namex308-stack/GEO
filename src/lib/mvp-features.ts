import type { TranslationKey } from "@/lib/i18n";

export interface MvpFeatureItem {
  labelKey: TranslationKey;
  /** Engine rule IDs that cover this checklist item, when applicable */
  ruleIds?: string[];
}

export interface MvpFeature {
  id: string;
  number: number;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  items: MvpFeatureItem[];
  highlight?: boolean;
}

/** Product MVP feature catalog — used on /features and marketing sections. */
export const MVP_FEATURES: MvpFeature[] = [
  {
    id: "website-audit",
    number: 1,
    titleKey: "mvp.website.title",
    descKey: "mvp.website.desc",
    items: [
      { labelKey: "mvp.website.i1", ruleIds: [] },
      { labelKey: "mvp.website.i2", ruleIds: [] },
    ],
  },
  {
    id: "seo-audit",
    number: 2,
    titleKey: "mvp.seo.title",
    descKey: "mvp.seo.desc",
    items: [
      { labelKey: "mvp.seo.i1", ruleIds: ["seo-title-len"] },
      { labelKey: "mvp.seo.i2", ruleIds: ["seo-desc-len"] },
      { labelKey: "mvp.seo.i3", ruleIds: ["seo-h1", "seo-hierarchy"] },
      { labelKey: "mvp.seo.i4", ruleIds: ["seo-internal-links"] },
      { labelKey: "mvp.seo.i5", ruleIds: ["seo-canonical"] },
      { labelKey: "mvp.seo.i6", ruleIds: ["seo-robots"] },
      { labelKey: "mvp.seo.i7", ruleIds: ["seo-sitemap"] },
      { labelKey: "mvp.seo.i8", ruleIds: ["seo-img-alt"] },
      { labelKey: "mvp.seo.i9", ruleIds: ["seo-og"] },
      { labelKey: "mvp.seo.i10", ruleIds: ["seo-page-weight"] },
    ],
  },
  {
    id: "geo-audit",
    number: 3,
    titleKey: "mvp.geo.title",
    descKey: "mvp.geo.desc",
    highlight: true,
    items: [
      { labelKey: "mvp.geo.i1", ruleIds: ["geo-ai-readiness"] },
      { labelKey: "mvp.geo.i2", ruleIds: ["geo-schema"] },
      { labelKey: "mvp.geo.i3", ruleIds: ["geo-faq"] },
      { labelKey: "mvp.geo.i4", ruleIds: ["geo-entity"] },
      { labelKey: "mvp.geo.i5", ruleIds: ["geo-product-schema"] },
      { labelKey: "mvp.geo.i6", ruleIds: ["geo-citation"] },
      { labelKey: "mvp.geo.i7", ruleIds: ["geo-quotable", "geo-depth"] },
    ],
  },
  {
    id: "trust-audit",
    number: 4,
    titleKey: "mvp.trust.title",
    descKey: "mvp.trust.desc",
    items: [
      { labelKey: "mvp.trust.i1", ruleIds: ["trust-https"] },
      { labelKey: "mvp.trust.i2", ruleIds: ["trust-privacy"] },
      { labelKey: "mvp.trust.i3", ruleIds: ["trust-terms"] },
      { labelKey: "mvp.trust.i4", ruleIds: ["trust-refund"] },
      { labelKey: "mvp.trust.i5", ruleIds: ["trust-contact"] },
      { labelKey: "mvp.trust.i6", ruleIds: ["trust-about"] },
      { labelKey: "mvp.trust.i7", ruleIds: ["trust-badges", "trust-reviews"] },
    ],
  },
  {
    id: "cro-audit",
    number: 5,
    titleKey: "mvp.cro.title",
    descKey: "mvp.cro.desc",
    items: [
      { labelKey: "mvp.cro.i1", ruleIds: ["cro-cta"] },
      { labelKey: "mvp.cro.i2", ruleIds: ["cro-images", "cro-depth"] },
      { labelKey: "mvp.cro.i3", ruleIds: ["cro-social", "cro-benefits"] },
      { labelKey: "mvp.cro.i4", ruleIds: ["trust-reviews"] },
      { labelKey: "mvp.cro.i5", ruleIds: ["cro-payments"] },
      { labelKey: "mvp.cro.i6", ruleIds: ["cro-price", "cro-cta"] },
    ],
  },
  {
    id: "overall-score",
    number: 6,
    titleKey: "mvp.score.title",
    descKey: "mvp.score.desc",
    items: [
      { labelKey: "mvp.score.i1" },
      { labelKey: "mvp.score.i2" },
      { labelKey: "mvp.score.i3" },
      { labelKey: "mvp.score.i4" },
      { labelKey: "mvp.score.i5" },
      { labelKey: "mvp.score.i6" },
    ],
  },
  {
    id: "ai-recommendations",
    number: 7,
    titleKey: "mvp.recs.title",
    descKey: "mvp.recs.desc",
    items: [
      { labelKey: "mvp.recs.i1" },
      { labelKey: "mvp.recs.i2" },
      { labelKey: "mvp.recs.i3" },
      { labelKey: "mvp.recs.i4" },
    ],
  },
  {
    id: "ai-generator",
    number: 8,
    titleKey: "mvp.generator.title",
    descKey: "mvp.generator.desc",
    items: [
      { labelKey: "mvp.generator.i1" },
      { labelKey: "mvp.generator.i2" },
      { labelKey: "mvp.generator.i3" },
      { labelKey: "mvp.generator.i4" },
      { labelKey: "mvp.generator.i5" },
      { labelKey: "mvp.generator.i6" },
    ],
  },
  {
    id: "dashboard",
    number: 9,
    titleKey: "mvp.dashboard.title",
    descKey: "mvp.dashboard.desc",
    items: [
      { labelKey: "mvp.dashboard.i1" },
      { labelKey: "mvp.dashboard.i2" },
      { labelKey: "mvp.dashboard.i3" },
      { labelKey: "mvp.dashboard.i4" },
      { labelKey: "mvp.dashboard.i5" },
    ],
  },
  {
    id: "pdf-reports",
    number: 10,
    titleKey: "mvp.pdf.title",
    descKey: "mvp.pdf.desc",
    items: [
      { labelKey: "mvp.pdf.i1" },
      { labelKey: "mvp.pdf.i2" },
    ],
  },
  {
    id: "competitor",
    number: 11,
    titleKey: "mvp.competitor.title",
    descKey: "mvp.competitor.desc",
    items: [
      { labelKey: "mvp.competitor.i1" },
      { labelKey: "mvp.competitor.i2" },
      { labelKey: "mvp.competitor.i3" },
    ],
  },
  {
    id: "auth",
    number: 12,
    titleKey: "mvp.auth.title",
    descKey: "mvp.auth.desc",
    items: [
      { labelKey: "mvp.auth.i1" },
      { labelKey: "mvp.auth.i2" },
      { labelKey: "mvp.auth.i3" },
    ],
  },
  {
    id: "billing",
    number: 13,
    titleKey: "mvp.billing.title",
    descKey: "mvp.billing.desc",
    items: [
      { labelKey: "mvp.billing.i1" },
      { labelKey: "mvp.billing.i2" },
      { labelKey: "mvp.billing.i3" },
      { labelKey: "mvp.billing.i4" },
    ],
  },
  {
    id: "usage",
    number: 14,
    titleKey: "mvp.usage.title",
    descKey: "mvp.usage.desc",
    items: [
      { labelKey: "mvp.usage.i1" },
      { labelKey: "mvp.usage.i2" },
      { labelKey: "mvp.usage.i3" },
    ],
  },
];
