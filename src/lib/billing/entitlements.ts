import type { PlanId } from "./plans";



export interface PlanLimits {

  /** null = unlimited */

  auditsPerMonth: number | null;

  /** null = unlimited history */

  historyLimit: number | null;

  generationsPerMonth: number | null;

  teamMembers: number;

  canCompare: boolean;

  canGenerate: boolean;

  canExportPdf: boolean;

  canWhiteLabelPdf: boolean;

  /** Full website crawl (Pro: 100 pages, Business: 1000) */

  canCrawl: boolean;

  /** null = unlimited pages per crawl */

  crawlMaxPages: number | null;

  /** Single homepage/product page only */

  homepageOnly: boolean;

  showFullBreakdown: boolean;

  showRecommendations: boolean;

  showGeoReadability: boolean;

  /** null = unlimited recommendations shown */

  recommendationsLimit: number | null;

  /** Weekly monitoring enabled */

  hasMonitoring: boolean;

  /** null = unlimited monitored sites */

  monitoringMaxSites: number | null;

  hasEmailNotifications: boolean;

  hasWeeklyReports: boolean;

  hasApiAccess: boolean;

  hasScheduledReports: boolean;

  hasPriorityProcessing: boolean;

}



const PLAN_LIMITS: Record<PlanId, PlanLimits> = {

  free: {

    auditsPerMonth: 3,

    historyLimit: 3,

    generationsPerMonth: 3,

    teamMembers: 1,

    canCompare: false,

    canGenerate: true,

    canExportPdf: false,

    canWhiteLabelPdf: false,

    canCrawl: false,

    crawlMaxPages: 0,

    homepageOnly: true,

    showFullBreakdown: true,

    showRecommendations: true,

    showGeoReadability: true,

    recommendationsLimit: 8,

    hasMonitoring: false,

    monitoringMaxSites: 0,

    hasEmailNotifications: false,

    hasWeeklyReports: false,

    hasApiAccess: false,

    hasScheduledReports: false,

    hasPriorityProcessing: false,

  },

  pro: {

    auditsPerMonth: 30,

    historyLimit: null,

    generationsPerMonth: null,

    teamMembers: 1,

    canCompare: true,

    canGenerate: true,

    canExportPdf: true,

    canWhiteLabelPdf: false,

    canCrawl: true,

    crawlMaxPages: 100,

    homepageOnly: false,

    showFullBreakdown: true,

    showRecommendations: true,

    showGeoReadability: true,

    recommendationsLimit: null,

    hasMonitoring: true,

    monitoringMaxSites: 1,

    hasEmailNotifications: true,

    hasWeeklyReports: true,

    hasApiAccess: false,

    hasScheduledReports: false,

    hasPriorityProcessing: false,

  },

  business: {

    auditsPerMonth: null,

    historyLimit: null,

    generationsPerMonth: null,

    teamMembers: 5,

    canCompare: true,

    canGenerate: true,

    canExportPdf: true,

    canWhiteLabelPdf: true,

    canCrawl: true,

    crawlMaxPages: 1000,

    homepageOnly: false,

    showFullBreakdown: true,

    showRecommendations: true,

    showGeoReadability: true,

    recommendationsLimit: null,

    hasMonitoring: true,

    monitoringMaxSites: null,

    hasEmailNotifications: true,

    hasWeeklyReports: true,

    hasApiAccess: true,

    hasScheduledReports: true,

    hasPriorityProcessing: true,

  },

};



export type Plan = PlanId;



export function getPlanLimits(plan: Plan): PlanLimits {

  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

}



export function isUnlimitedAudits(plan: Plan): boolean {

  return getPlanLimits(plan).auditsPerMonth === null;

}



export function canRunAudit(plan: Plan, auditsUsed: number): boolean {

  const limit = getPlanLimits(plan).auditsPerMonth;

  if (limit === null) return true;

  return auditsUsed < limit;

}



export function canCompare(plan: Plan): boolean {

  return getPlanLimits(plan).canCompare;

}



export function canCrawl(plan: Plan): boolean {

  return getPlanLimits(plan).canCrawl;

}



export function getCrawlMaxPages(plan: Plan): number {

  const limits = getPlanLimits(plan);

  if (!limits.canCrawl) return 0;

  return limits.crawlMaxPages ?? 1000;

}



export function canUseMonitoring(plan: Plan): boolean {

  return getPlanLimits(plan).hasMonitoring;

}



export function canAddMonitoringSite(plan: Plan, currentSites: number): boolean {

  const limits = getPlanLimits(plan);

  if (!limits.hasMonitoring) return false;

  if (limits.monitoringMaxSites === null) return true;

  return currentSites < limits.monitoringMaxSites;

}



export function canSendEmailNotifications(plan: Plan): boolean {

  return getPlanLimits(plan).hasEmailNotifications;

}



export function canGenerate(plan: Plan): boolean {

  return getPlanLimits(plan).canGenerate;

}



export function canRunGeneration(plan: Plan, generationsUsed: number): boolean {

  const limits = getPlanLimits(plan);

  if (!limits.canGenerate) return false;

  if (limits.generationsPerMonth === null) return true;

  return generationsUsed < limits.generationsPerMonth;

}



export function canExportPdf(plan: Plan): boolean {

  return getPlanLimits(plan).canExportPdf;

}



export function formatAuditLimit(plan: Plan): string {

  const limit = getPlanLimits(plan).auditsPerMonth;

  if (limit === null) return "Unlimited";

  return String(limit);

}


