/** @deprecated Prefer analysis_categories.slug — kept for API/UI compatibility. */
export type ScorePillar = "conversion" | "seo" | "geo" | "trust";

export interface ScoreBreakdown {
  pillar: ScorePillar;
  score: number;
  max: number;
  label: string;
  summary: string;
}

export interface Recommendation {
  id: string;
  pillar: ScorePillar;
  severity: "critical" | "warning" | "opportunity";
  problem: string;
  solution: string;
  impact: "high" | "medium" | "low";
  effort?: "quick" | "medium" | "involved";
  estimatedLift?: string;
  category?: string;
  /** Model confidence that the finding is accurate (0–100). */
  confidence?: number;
  /** URL path or page area affected by the issue. */
  affectedPage?: string;
  /** Short projected business/UX impact description. */
  projectedImpact?: string;
  /** Current (before) excerpt for preview. */
  beforePreview?: string;
  /** Suggested (after) excerpt for preview. */
  afterPreview?: string;
  /** Finding origin — firecrawl heuristics, gemini, or rule engine. */
  source?: "firecrawl" | "gemini" | "rule_engine";
  /** How the fix can be applied. */
  fixType?: "manual" | "generated" | "automatic";
  /** 1-based rank after rule-based prioritization (severity → category). */
  priorityRank?: number;
  /** True for the top 3 quick wins ("ابدأ بهذا"). */
  quickWin?: boolean;
  /** Module severity band used by the fixed priority rule. */
  severityBand?: "high" | "medium" | "low";
}

export interface PageSignalError {
  id: string;
  severity: "critical" | "warning";
  label: string;
  detail: string;
}

/** Merchant-facing detection signals from the scraped page. */
export interface PageSignals {
  websiteDetected: boolean;
  productPageDetected: boolean;
  productImageDetected: boolean;
  productImageUrl?: string;
  pageTitle?: string;
  pageType?: string;
  errors: PageSignalError[];
}

/** Crawl / scrape provenance shown on the report. */
export interface CrawlMetadata {
  source: "firecrawl" | "fallback" | "none";
  scrapeMs?: number;
  pageType?: string;
  imageCount?: number;
  contentHash?: string;
  warning?: string;
  scrapedAt: string;
}

export interface GeneratedContent {
  title: string;
  description: string;
  faq: { q: string; a: string }[];
  metaDescription: string;
  adCopy: { platform: string; headline: string; body: string; cta: string }[];
  source?: "gemini" | "page";
}

export type GeoFindingStatus = "pass" | "warn" | "fail";

export interface GeoFinding {
  id: string;
  status: GeoFindingStatus;
  label: string;
  detail: string;
}

export interface GeoComponentScores {
  faq: number;
  productSchema: number;
  organizationSchema: number;
  breadcrumbSchema: number;
  headings: number;
  contentStructure: number;
  internalLinks: number;
  entityRichness: number;
  metadata: number;
  contentClarity: number;
}

/** Deterministic GEO / AI Visibility analysis stored with every audit. */
export interface GeoAnalysisResult {
  score: number;
  summary: string;
  findings: GeoFinding[];
  componentScores: GeoComponentScores;
  signals: {
    faqCount: number;
    hasFaq: boolean;
    hasFaqSchema: boolean;
    hasProductSchema: boolean;
    hasOrganizationSchema: boolean;
    hasBreadcrumbSchema: boolean;
    headingCount: number;
    internalLinkCount: number;
    wordCount: number;
  };
}

export interface AuditData {
  id?: string;
  productUrl: string;
  storeUrl?: string;
  competitorUrl?: string;
  storeName: string;
  productName: string;
  overallScore: number;
  competitorScore?: number;
  breakdown: ScoreBreakdown[];
  competitorBreakdown?: ScoreBreakdown[];
  recommendations: Recommendation[];
  geoReadability: {
    chatgpt: number;
    perplexity: number;
    googleAI: number;
  };
  /** Rule-engine GEO analysis (score, findings, component breakdown). */
  geoAnalysis?: GeoAnalysisResult;
  createdAt: string;
  /** True when Gemini was unavailable and page-signal heuristics were used. */
  demoMode?: boolean;
  /** What the crawler found on the merchant's page. */
  pageSignals?: PageSignals;
  /** Scrape provenance for the primary page. */
  crawlMetadata?: CrawlMetadata;
  /** Latest AI (or page-derived) rewrite payload for this audit. */
  generatedContent?: GeneratedContent;
  /** Persisted audit lifecycle status (queued → … → completed|failed). */
  status?: string;
}

export interface OnboardingAnswers {
  businessName: string;
  storeUrl: string;
  country: string;
  primaryLanguage: string;
  platform: string;
  storeSize: string;
  businessCategory: string;
  primaryGoal: string;
  monthlyTraffic: string;
  monthlyOrders: string;
  mainChallenge: string;
  competitorUrl: string;
  /** @deprecated Prefer mainChallenge — kept for prompt sanitizer compat. */
  challenge?: string;
  /** @deprecated Prefer storeSize */
  priceRange?: string;
  /** @deprecated Prefer businessCategory */
  audience?: string;
  /** @deprecated Prefer primaryGoal */
  referral?: string;
}

