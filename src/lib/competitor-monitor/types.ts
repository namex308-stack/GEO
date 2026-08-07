export type CompetitorChangeType =
  | "price_increase"
  | "price_drop"
  | "content_change"
  | "title_change"
  | "description_change"
  | "new_faq"
  | "removed_faq"
  | "new_reviews"
  | "removed_reviews"
  | "schema_change"
  | "trust_change"
  | "seo_change"
  | "ai_visibility_change";

export type CompetitorChangeSeverity = "critical" | "warning" | "info";

export type CompetitorFaqItem = { q: string; a: string };

/** Normalized monitorable fields extracted from a competitor page. */
export type CompetitorSignals = {
  title: string;
  description: string;
  priceRaw: string | null;
  priceValue: number | null;
  currency: string | null;
  rating: string | null;
  reviewCount: number | null;
  faq: CompetitorFaqItem[];
  faqKeys: string[];
  schemaTypes: string[];
  schemaFingerprint: string;
  trustScore: number;
  seoScore: number;
  geoScore: number;
  conversionScore: number;
  overallScore: number;
  contentHash: string;
  hasTrustSignals: boolean;
};

export type CompetitorScoresPayload = {
  overall: number;
  conversion: number;
  seo: number;
  geo: number;
  trust: number;
  summaries: {
    conversion: string;
    seo: string;
    geo: string;
    trust: string;
  };
};

export type DetectedCompetitorChange = {
  changeType: CompetitorChangeType;
  severity: CompetitorChangeSeverity;
  fieldPath: string;
  previousValue: unknown;
  currentValue: unknown;
  summary: string;
  businessImpact: string;
  recommendedAction: string;
};

export type CompetitorTargetSummary = {
  id: string;
  workspaceId: string;
  storeId: string | null;
  label: string | null;
  url: string;
  isActive: boolean;
  cadenceHours: number;
  lastCheckedAt: string | null;
  lastChangedAt: string | null;
};

export type CompetitorSnapshotSummary = {
  id: string;
  targetId: string;
  scrapedAt: string;
  scrapeSource: "firecrawl" | "fallback" | "audit_reuse" | "none";
  scrapeStatus: "ok" | "failed";
  title: string | null;
  price: string | null;
  rating: string | null;
  reviewCount: string | null;
  faqCount: number;
  overallScore: number | null;
  geoScore: number | null;
  seoScore: number | null;
  trustScore: number | null;
};

export type CompetitorChangeRecord = {
  id: string;
  targetId: string;
  changeType: CompetitorChangeType;
  severity: CompetitorChangeSeverity;
  summary: string;
  businessImpact: string | null;
  recommendedAction: string | null;
  previousValue: unknown;
  currentValue: unknown;
  detectedAt: string;
};

export type CompetitorMonitorOverview = {
  targets: CompetitorTargetSummary[];
  latestChanges: CompetitorChangeRecord[];
  timeline: CompetitorChangeRecord[];
  businessImpact: string[];
  recommendedActions: string[];
  crawlEnabled: boolean;
};

export type CompetitorTargetDetail = {
  target: CompetitorTargetSummary;
  snapshots: CompetitorSnapshotSummary[];
  timeline: CompetitorChangeRecord[];
  latestChanges: CompetitorChangeRecord[];
  businessImpact: string[];
  recommendedActions: string[];
};
