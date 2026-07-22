export interface PageSnapshot {
  url: string;
  title: string;
  metaDescription: string;
  h1: string[];
  headings: { level: number; text: string }[];
  html: string;
  markdown: string;
  images: number;
  links: { href: string; text: string }[];
  hasCanonical: boolean;
  hasHttps: boolean;
  schemaOrg: Record<string, unknown>[];
  openGraphTitle: string;
  openGraphDescription: string;
  hasOpenGraphImage: boolean;
  internalLinkCount: number;
  pageWeightKb: number;
  siteHasRobotsTxt: boolean;
  siteHasSitemap: boolean;
  hasViewportMeta: boolean;
  formCount: number;
  hasSearchInput: boolean;
  hasCartCues: boolean;
}

export interface RuleResult {
  id: string;
  label: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
  category?: ScoreCategory;
  confidence?: number;
  evidence?: string[];
}

export type ScoreCategory =
  | "technical_seo"
  | "performance"
  | "accessibility"
  | "security"
  | "content"
  | "cro"
  | "ux"
  | "ui"
  | "ecommerce"
  | "geo"
  | "brand"
  | "mobile";

export interface EngineResult {
  pillar: "conversion" | "seo" | "geo" | "trust";
  score: number;
  maxScore: number;
  label: string;
  summary: string;
  rules: RuleResult[];
}

export interface CategoryResult {
  category: ScoreCategory;
  score: number;
  maxScore: number;
  label: string;
  summary: string;
  rules: RuleResult[];
  missing?: boolean;
}

export interface OrchestratorResult {
  overallScore: number;
  breakdown: EngineResult[];
  competitorBreakdown?: EngineResult[];
  competitorScore?: number;
}
