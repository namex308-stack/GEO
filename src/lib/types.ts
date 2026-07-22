export type ScorePillar = "conversion" | "seo" | "geo" | "trust";

export interface ScrapedPage {
  url: string;
  title: string;
  description: string;
  markdown: string;
  html?: string;
  images?: string[];
}

export interface ScoreBreakdown {
  pillar: ScorePillar;
  score: number;
  max: number;
  label: string;
  summary: string;
}

export interface QuickFixPayload {
  title: string;
  description: string;
  codeSnippet: string;
  steps: string[];
}

export interface Recommendation {
  id: string;
  pillar: ScorePillar;
  severity: "critical" | "warning" | "opportunity";
  problem: string;
  why?: string;
  solution: string;
  impact: "high" | "medium" | "low";
  effort?: "quick" | "medium" | "involved";
  estimatedLift?: string;
  category?: string;
  /** Quick Fixes enrichment — attached by enrichIssues() based on plan */
  hasFix?: boolean;
  upgradeRequired?: boolean;
  issueCode?: string;
  quickFix?: QuickFixPayload;
}

export interface CustomerEyeTest {
  confusionScore: number; // 0-100
  mainBlocker: string; // جملة واحدة بالعربي
  firstImpression: string; // ماذا يفهم العميل في 3 ثوان
  trustLevel: "low" | "mid" | "high";
  buyingIntent: "low" | "mid" | "high";
  topQuestion: string; // السؤال الأكثر إلحاحاً في ذهن العميل
}

export interface AuditEngineResultsPayload {
  version: 1;
  generatedAt: string;
  aiEnhanced: boolean;
  engines: {
    overallScore: number;
    breakdown: unknown;
    competitorScore?: number;
    competitorBreakdown?: unknown;
  };
  categories?: unknown;
  validation?: unknown;
  explainability?: unknown;
  contentAnalysis?: unknown;
  insights?: unknown;
  geoReadability?: {
    chatgpt: number;
    perplexity: number;
    googleAI: number;
  };
  interpretation?: {
    pillarSummaries?: Record<string, string>;
    compareGaps?: unknown;
  };
  customerEyeTest?: CustomerEyeTest;
}

export interface AuditData {
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
  createdAt: string;
  /** True when Gemini successfully interpreted results; false when rule-based fallback was used. */
  aiEnhanced?: boolean;
  engineResults?: AuditEngineResultsPayload;
  /** First-impression customer eye test (Arabic). */
  customerEyeTest?: CustomerEyeTest;
  crawlSummary?: {
    totalPages: number;
    pagesWithIssues: number;
    averageScore: number;
    bestPage: { url: string; title: string; score: number } | null;
    worstPage: { url: string; title: string; score: number } | null;
    pillarAverages: Record<string, number>;
  };
}

export interface OnboardingAnswers {
  platform: string;
  storeStage: string;
  challenge: string;
  primaryGoal: string;
  priceRange: string;
  trafficSource: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  period: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
  cta: string;
  auditsPerMonth: string;
}
