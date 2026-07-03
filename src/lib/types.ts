export type View =
  | "landing"
  | "login"
  | "onboarding"
  | "audit"
  | "results"
  | "dashboard"
  | "pricing";

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
