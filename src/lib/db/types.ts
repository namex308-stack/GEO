/**
 * Database / domain types for the ConvAudit audit engine.
 * Mirrors supabase/migrations/20260728140000_audit_engine_schema.sql
 */

export type PlanId = "free" | "pro" | "business";
export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";
export type AuditStatus = "queued" | "scraping" | "analyzing" | "completed" | "failed";
export type AuditPageRole = "primary" | "competitor";
export type PageType =
  | "homepage"
  | "product"
  | "collection"
  | "faq"
  | "contact"
  | "policy"
  | "blog"
  | "unknown";
export type ScoreSubject = "self" | "competitor";
export type RecommendationSource = "firecrawl" | "gemini" | "rule_engine";
export type RecommendationFixType = "manual" | "generated" | "automatic";
export type AnalysisRunStatus = "queued" | "running" | "completed" | "failed";
export type UsageMetric = "audit" | "ai_generation" | "competitor_compare" | "api_call";

/** Canonical analysis category slugs (seeded in analysis_categories). */
export type CategorySlug = "conversion" | "seo" | "geo" | "trust";

export interface AnalysisCategory {
  id: string;
  slug: CategorySlug | string;
  display_name: string;
  description: string | null;
  created_at: string;
}

/** Normalized page content for analyzers — never includes raw HTML. */
export interface NormalizedPage {
  url: string;
  title: string;
  description: string;
  pageType: PageType;
  /** Truncated markdown suitable for LLM context. */
  markdown: string;
  imageCount: number;
  contentHash: string;
  structuredData: Record<string, unknown>;
  scrapeStatus: "ok" | "failed";
  scrapeMs?: number;
}

export type AnalyzerName =
  | "conversion"
  | "seo"
  | "geo"
  | "trust"
  | "recommendations"
  | "content_generation";

export interface AnalyzerScoreResult {
  categorySlug: CategorySlug;
  score: number;
  max: number;
  label: string;
  summary: string;
}

export interface AnalyzerRecommendation {
  externalKey?: string;
  categorySlug: CategorySlug;
  severity: "critical" | "warning" | "opportunity";
  impact: "high" | "medium" | "low";
  effort?: "quick" | "medium" | "involved";
  problem: string;
  solution: string;
  confidence?: number;
  affectedPage?: string;
  projectedImpact?: string;
  beforePreview?: string;
  afterPreview?: string;
  estimatedLift?: string;
  source: RecommendationSource;
  fixType: RecommendationFixType;
}

export interface AnalyzerJsonResult {
  scores?: AnalyzerScoreResult[];
  competitorScores?: AnalyzerScoreResult[];
  recommendations?: AnalyzerRecommendation[];
  geoReadability?: { chatgpt: number; perplexity: number; googleAI: number };
  overallScoreHint?: number;
  competitorScoreHint?: number;
  tokensUsed?: number;
  estimatedCost?: number;
}
