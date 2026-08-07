import type { Recommendation, ScorePillar } from "@/lib/types";

export type ScoreDeltaDirection = "up" | "down" | "flat";

export type ScoreChange = {
  pillar: ScorePillar | "overall";
  previous: number | null;
  current: number | null;
  delta: number;
  direction: ScoreDeltaDirection;
  /** True when |delta| meets the meaningful-change threshold. */
  meaningful: boolean;
};

export type WeeklyIssueItem = {
  id: string;
  pillar: ScorePillar;
  severity: Recommendation["severity"];
  impact: Recommendation["impact"];
  problem: string;
  solution: string;
};

export type WeeklyPriorityAction = WeeklyIssueItem & {
  rank: number;
  /** Why this action appears (new finding or severity/impact changed). */
  reason: "new" | "worsened" | "changed";
};

export type WeeklyExecutiveSummary = {
  storeName: string;
  headline: string;
  bullets: string[];
  healthBand: "excellent" | "good" | "fair" | "poor";
  overallScore: number;
  overallDelta: number;
};

export type WeeklyReportPayload = {
  storeId: string;
  storeName: string;
  storeUrl: string;
  workspaceId: string;
  periodStart: string;
  periodEnd: string;
  latestAuditId: string;
  previousAuditId: string | null;
  executiveSummary: WeeklyExecutiveSummary;
  overallScoreChange: ScoreChange;
  geoScoreChange: ScoreChange;
  seoScoreChange: ScoreChange;
  trustScoreChange: ScoreChange;
  conversionScoreChange: ScoreChange;
  newIssues: WeeklyIssueItem[];
  resolvedIssues: WeeklyIssueItem[];
  highestPriorityActions: WeeklyPriorityAction[];
  /** Narrative AI (or deterministic fallback) executive summary. */
  aiExecutiveSummary: string;
  meaningfulChangeCount: number;
};

export type WeeklyReportListItem = {
  id: string;
  storeId: string;
  storeName: string;
  storeUrl: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  status: "pending" | "ready" | "failed" | "skipped";
  overallScore: number | null;
  overallDelta: number | null;
  meaningfulChangeCount: number;
};

export type WeeklyReportRecord = {
  id: string;
  workspaceId: string;
  storeId: string;
  periodStart: string;
  periodEnd: string;
  latestAuditId: string | null;
  previousAuditId: string | null;
  status: WeeklyReportListItem["status"];
  payload: WeeklyReportPayload;
  emailHtml: string | null;
  emailSentAt: string | null;
  generatedAt: string;
  errorMessage: string | null;
};
