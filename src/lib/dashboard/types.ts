import type { PlanId, UsageMetric } from "@/lib/db/types";
import type { AuditHistoryItem } from "@/lib/audits/types";

export type PlanLimits = {
  planId: PlanId;
  displayName: string;
  auditsPerMonth: number | null;
  aiGensPerMonth: number | null;
  storesLimit: number | null;
  features: {
    aiGenerator: boolean;
    competitor: boolean;
    api: boolean;
    /** Scheduled competitor monitoring (Business). */
    competitorMonitoring: boolean;
    /** Weekly monitoring / reports (Business). */
    weeklyMonitoring: boolean;
    /** Automated alerts (Business). */
    automatedAlerts: boolean;
  };
};

export type UsageCounts = Record<UsageMetric, number>;

export type DashboardPriorityIssue = {
  id: string;
  auditId: string;
  problem: string;
  solution: string;
  severity: "critical" | "warning" | "opportunity";
  impact: "high" | "medium" | "low";
  effort: string | null;
  pillar: string | null;
  projectedImpact: string | null;
};

export type DashboardTopIssue = {
  problem: string;
  count: number;
  severity: "critical" | "warning" | "opportunity";
  auditId: string | null;
};

/** Payload for GET /api/dashboard — shared by API and client. */
export type DashboardPayload = {
  plan: PlanLimits;
  stats: {
    avgScore: number | null;
    totalAudits: number;
    auditsThisMonth: number;
    auditsLimit: number | null;
    geoScore: number | null;
    openRecommendations: number;
    totalRecommendations: number;
    latestStoreScore: number | null;
    pagesScanned: number;
    pagesThisMonth: number;
  };
  latestAudit: {
    id: string;
    productName: string;
    storeName: string;
    overallScore: number | null;
    completedAt: string | null;
  } | null;
  geoSignals: {
    chatgpt: number | null;
    perplexity: number | null;
    googleAi: number | null;
  } | null;
  priorityIssue: DashboardPriorityIssue | null;
  nextFixes: DashboardPriorityIssue[];
  topIssues: DashboardTopIssue[];
  trend: { label: string; score: number; date: string }[];
  recent: AuditHistoryItem[];
  notificationCount: number;
  usagePct: number;
  /** Preferred profile display name (profiles.full_name), when set. */
  displayName: string | null;
};
