import type { StoreHealthBand } from "@/lib/report/executive-summary";
import type { OverviewBalance } from "@/lib/report/overview-balance";
import type { ScorePillar } from "@/lib/types";

export type HealthPillarKey = ScorePillar | "performance";

export type HealthPillarStatus = "healthy" | "warning" | "critical" | "unknown";

export type HealthPillar = {
  key: HealthPillarKey;
  score: number | null;
  status: HealthPillarStatus;
  summary: string | null;
};

export type HealthIssueItem = {
  id: string;
  problem: string;
  solution: string;
  severity: "critical" | "warning" | "opportunity";
  pillar: string | null;
};

export type HealthSignalItem = {
  id: string;
  label: string;
  detail: string;
};

export type StoreHealthPayload = {
  storeName: string;
  auditId: string | null;
  /** Composed from stored SEO/GEO/Conversion/Trust + performance proxy. */
  currentHealth: number | null;
  healthBand: StoreHealthBand | null;
  trend: "up" | "down" | "flat";
  pillars: HealthPillar[];
  criticalProblems: HealthIssueItem[];
  warnings: HealthIssueItem[];
  healthySignals: HealthSignalItem[];
  lastScan: string | null;
  nextScan: string | null;
  nextScanLabel: string;
  historicalTrend: { label: string; score: number; date: string }[];
  recommendations: HealthIssueItem[];
  balance: OverviewBalance | null;
};
