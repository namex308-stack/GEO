"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Zap,
  Search,
  Bot,
  ShieldCheck,
  ArrowRight,
  X,
  Check,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Copy,
  Target,
  Clock,
  Gauge,
  ListChecks,
  AlertTriangle,
  Globe2,
  Package,
  ImageIcon,
  Wrench,
  Briefcase,
} from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScoreRadial, ScoreBar } from "@/components/common/score-viz";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";
import { prioritizeRecommendations } from "@/lib/ai/recommendations";
import {
  buildConsultantRecommendationView,
  formatRecommendationCopy,
  impactLabelKey,
  PILLAR_LABEL_KEYS,
  priorityBadgeClass,
  priorityBadgeLabelKey,
  priorityBadgeLevel,
} from "@/lib/report/recommendation-display";
import {
  buildExecutiveSummary,
  type ExecutiveSummaryModel,
  type ImpactEstimate,
  type StoreHealthBand,
} from "@/lib/report/executive-summary";
import {
  describeScoreBalance,
  type BalanceProfile,
  type OverviewBalance,
} from "@/lib/report/overview-balance";
import {
  AI_SIMULATOR_EXAMPLE_PROMPTS,
  simulateAiRecommendation,
  type SimulatedAiResponse,
} from "@/lib/report/ai-recommendation-simulator";
import {
  buildGrowthRoadmap,
  ROADMAP_HORIZON_ORDER,
  type GrowthRoadmapTask,
  type RoadmapDifficulty,
  type RoadmapHorizon,
  type RoadmapPriority,
} from "@/lib/report/growth-roadmap";
import {
  buildEstimatedBusinessImpact,
  type EstimatedBusinessImpactModel,
  type QualitativeImpactItem,
  type QualitativeImpactLevel,
} from "@/lib/report/estimated-business-impact";
import {
  resolveQuickWinsWithCompletion,
  type QuickWinDifficulty,
  type QuickWinTask,
} from "@/lib/report/quick-wins";
import type { AuditData, PageSignals, Recommendation, ScorePillar } from "@/lib/types";
import { decodeAuditDisplayFields } from "@/lib/text/decode-html";

type PillarIcon = typeof Zap;

const PILLAR_META: Record<
  ScorePillar,
  { icon: PillarIcon; color: string; labelKey: TranslationKey }
> = {
  conversion: { icon: Zap, color: "#FF6600", labelKey: PILLAR_LABEL_KEYS.conversion },
  seo: { icon: Search, color: "#ff983f", labelKey: PILLAR_LABEL_KEYS.seo },
  geo: { icon: Bot, color: "#cc5200", labelKey: PILLAR_LABEL_KEYS.geo },
  trust: { icon: ShieldCheck, color: "#929292", labelKey: PILLAR_LABEL_KEYS.trust },
};

export type AuditReportProps = {
  audit?: AuditData | null;
  demoMode?: boolean;
  aiConfigured?: boolean;
};

export function AuditReport({
  audit: rawAudit,
  demoMode = false,
  aiConfigured = true,
}: AuditReportProps) {
  const t = useT();
  const audit = rawAudit ? decodeAuditDisplayFields(rawAudit) : rawAudit;

  if (!audit) {
    return (
      <PageShell>
        <PageHeader title={t("report.title")} icon={Gauge} back="/dashboard" />
        <PageContent className="max-w-lg">
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
            <AlertTriangle className="size-10 text-amber-500 mx-auto mb-3" />
            <h2 className="font-display text-xl font-bold">{t("report.noReportFound")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("report.noReportHint")}
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link href="/audit/new">{t("auditNew.runAudit")}</Link>
            </Button>
          </div>
        </PageContent>
      </PageShell>
    );
  }

  const isDemo = demoMode || Boolean(audit.demoMode);
  const showAiWarning = !aiConfigured || isDemo;
  const auditId = audit.id ?? "demo";
  const prioritized = prioritizeRecommendations(audit.recommendations);
  const criticalCount = prioritized.filter((r) => r.severity === "critical").length;
  const scoreDelta =
    audit.competitorScore != null ? audit.overallScore - audit.competitorScore : null;

  const pillars = audit.breakdown.map((b) => ({
    ...b,
    ...PILLAR_META[b.pillar],
  }));

  const comparisonData =
    audit.competitorBreakdown?.map((c) => {
      const you = audit.breakdown.find((b) => b.pillar === c.pillar)?.score ?? 0;
      return { pillar: t(PILLAR_META[c.pillar].labelKey), you, competitor: c.score };
    }) ?? [];

  const signals = audit.pageSignals ?? deriveSignalsFromAudit(audit);
  const executiveSummary = buildExecutiveSummary(audit);

  return (
    <PageShell>
      <PageHeader
        title={t("report.title")}
        subtitle={audit.productUrl}
        icon={Gauge}
        back="/dashboard"
        actions={
          <Button variant="ghost" size="sm" asChild className="rounded-full hidden sm:inline-flex">
            <Link href="/audit/new">
              <RotateCcw className="size-4 me-1" /> {t("report.reaudit")}
            </Link>
          </Button>
        }
      />
      <PageContent className="space-y-8">
        <ExecutiveSummarySection summary={executiveSummary} />

        <EstimatedBusinessImpactSection audit={audit} />

        <QuickWinsSection audit={audit} />

        <ScoreOverviewSection
          overallScore={audit.overallScore}
          breakdown={audit.breakdown}
        />

        {(isDemo || showAiWarning) && (
          <div className="flex flex-wrap gap-2">
            {isDemo && (
              <Badge
                variant="outline"
                className="rounded-full gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle className="size-3" />
                {t("report.demoOnly")}
              </Badge>
            )}
            {!aiConfigured && (
              <Badge
                variant="outline"
                className="rounded-full gap-1.5 border-rose-500/30 bg-rose-500/5 text-rose-600"
              >
                {t("report.geminiMissing")}
              </Badge>
            )}
          </div>
        )}

        <PageSignalsPanel signals={signals} productUrl={audit.productUrl} productName={audit.productName} />

        {audit.crawlMetadata && (
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
              <Globe2 className="size-5 text-primary" /> {t("report.crawlMetadata")}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <MetaItem label={t("report.metaSource")} value={audit.crawlMetadata.source} />
              <MetaItem
                label={t("report.metaScrapeTime")}
                value={
                  audit.crawlMetadata.scrapeMs != null
                    ? `${audit.crawlMetadata.scrapeMs} ms`
                    : "—"
                }
              />
              <MetaItem label={t("report.metaPageType")} value={audit.crawlMetadata.pageType || "—"} />
              <MetaItem
                label={t("report.metaImages")}
                value={
                  audit.crawlMetadata.imageCount != null
                    ? String(audit.crawlMetadata.imageCount)
                    : "—"
                }
              />
              <MetaItem
                label={t("report.metaScrapedAt")}
                value={new Date(audit.crawlMetadata.scrapedAt).toLocaleString()}
              />
              <MetaItem
                label={t("report.metaContentHash")}
                value={
                  audit.crawlMetadata.contentHash
                    ? `${audit.crawlMetadata.contentHash.slice(0, 12)}…`
                    : "—"
                }
              />
            </div>
            {audit.crawlMetadata.warning && (
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                {audit.crawlMetadata.warning}
              </p>
            )}
          </div>
        )}

        {/* Executive summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 blur-3xl rounded-full -z-0" />
          <div className="relative grid lg:grid-cols-[auto_1fr] gap-8 items-center">
            <div className="flex flex-col items-center text-center">
              <ScoreRadial score={audit.overallScore} size={180} stroke={12} label={t("report.storeScore")} />
              <p className="mt-3 max-w-[220px] text-xs text-muted-foreground leading-relaxed">
                {t("report.scoreMeaning", { score: audit.overallScore })}
              </p>
              {scoreDelta != null && (
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  <TrendingUp className="size-4" /> {t("report.vsCompetitor", { count: scoreDelta })}
                </div>
              )}
            </div>
            <div>
              <Badge
                variant="outline"
                className="rounded-full mb-3 gap-1.5 border-primary/30 bg-primary/5 text-primary"
              >
                <Sparkles className="size-3" /> {t("report.auditComplete")}
              </Badge>
              <h1 className="font-display text-2xl font-bold">{audit.productName}</h1>
              <p className="mt-1 text-sm text-muted-foreground break-all">{audit.productUrl}</p>
              {audit.storeName && (
                <p className="mt-1 text-xs text-muted-foreground">{audit.storeName}</p>
              )}
              <div className="mt-5 grid sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      icon: Zap,
                      labelKey: "report.criticalIssues" as TranslationKey,
                      value: String(criticalCount),
                      tone: "rose" as const,
                    },
                    {
                      icon: TrendingUp,
                      labelKey: "report.projectedLift" as TranslationKey,
                      value: t("report.pointsValue", { count: Math.max(8, 100 - audit.overallScore) }),
                      tone: "primary" as const,
                    },
                    {
                      icon: ListChecks,
                      labelKey: "report.recommendations" as TranslationKey,
                      value: String(prioritized.length),
                      tone: "brand" as const,
                    },
                  ] as const
                ).map((s, i) => {
                  const colors = {
                    rose: "bg-rose-500/10 text-rose-500",
                    primary: "bg-primary/10 text-primary",
                    brand: "bg-brand/10 text-brand",
                  };
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-border/50 bg-background/50 p-3.5 flex items-center gap-3"
                    >
                      <span
                        className={`size-9 rounded-lg grid place-items-center shrink-0 ${colors[s.tone]}`}
                      >
                        <s.icon className="size-5" />
                      </span>
                      <div>
                        <div className="font-display text-lg font-bold tabular-nums">{s.value}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{t(s.labelKey)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {prioritized[0] && (
                <div className="mt-5 rounded-xl border border-primary/25 bg-primary/5 p-4 text-start">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {t("report.nextAction")}
                  </div>
                  <p className="mt-1 text-sm font-semibold leading-snug">{prioritized[0].problem}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("report.nextActionHint")}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Pillars */}
        <div>
          <h2 className="font-display text-2xl font-bold mb-5">{t("report.scoreBreakdown")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.pillar}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border/60 bg-card p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="size-10 rounded-xl grid place-items-center"
                    style={{ background: `${p.color}1a`, color: p.color }}
                  >
                    <p.icon className="size-5" />
                  </span>
                  <span
                    className="font-display text-2xl font-extrabold tabular-nums"
                    style={{ color: p.color }}
                  >
                    {p.score}
                  </span>
                </div>
                <div className="font-semibold text-sm">{t(p.labelKey)}</div>
                <div className="mt-2.5">
                  <ScoreBar score={p.score} label="" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{p.summary}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="grid lg:grid-cols-2 gap-6">
          {comparisonData.length > 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" /> {t("report.competitorComparison")}
              </h2>
              <div className="mt-5 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    layout="vertical"
                    margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                  >
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      type="category"
                      dataKey="pillar"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontWeight: 600 }}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="competitor" radius={[0, 6, 6, 0]} fill="var(--chart-4)" fillOpacity={0.35} barSize={14} />
                    <Bar dataKey="you" radius={[0, 6, 6, 0]} fill="var(--chart-1)" barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-5 text-xs mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-primary" /> {t("report.you")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-muted-foreground/40" /> {t("report.competitor")}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col justify-center">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" /> {t("report.competitorComparison")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">{t("report.competitorEmpty")}</p>
            </div>
          )}

          <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/5 to-transparent p-6">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="size-5 text-brand" />
              <h2 className="font-display text-lg font-bold">{t("report.geoTitle")}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{t("report.geoSub")}</p>
            {audit.geoAnalysis && (
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <div className="text-3xl font-display font-bold text-brand tabular-nums">
                  {audit.geoAnalysis.score}
                  <span className="text-sm font-medium text-muted-foreground">/100</span>
                </div>
                <p className="text-sm text-muted-foreground flex-1 min-w-[12rem]">
                  {audit.geoAnalysis.summary}
                </p>
              </div>
            )}
            <div className="mt-5 grid grid-cols-3 gap-4">
              {(
                [
                  {
                    key: "chatgpt",
                    labelKey: "report.geoEngineChatgpt" as TranslationKey,
                    score: audit.geoReadability.chatgpt,
                  },
                  {
                    key: "perplexity",
                    labelKey: "report.geoEnginePerplexity" as TranslationKey,
                    score: audit.geoReadability.perplexity,
                  },
                  {
                    key: "googleAi",
                    labelKey: "report.geoEngineGoogleAi" as TranslationKey,
                    score: audit.geoReadability.googleAI,
                  },
                ] as const
              ).map((g) => (
                <div key={g.key} className="text-center rounded-xl border border-border/50 bg-background/40 p-4">
                  <ScoreRadial score={g.score} size={88} stroke={7} gold />
                  <div className="text-xs font-semibold mt-2">{t(g.labelKey)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AiRecommendationSimulator audit={audit} />

        {/* Unified prioritized recommendations */}
        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold">{t("report.aiRecommendations")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("report.priorityListHint")}</p>
            </div>
            {prioritized.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("report.showingAll", { count: prioritized.length })}
              </p>
            )}
          </div>
          <ol className="space-y-4">
            {prioritized.map((r, i) => (
              <li key={r.id}>
                <RecommendationCard rec={r} index={i} />
              </li>
            ))}
          </ol>
          {prioritized.length === 0 && (
            <p className="text-sm text-muted-foreground rounded-2xl border border-border/60 bg-card p-6 text-center">
              {t("report.emptyRecommendations")}
            </p>
          )}
        </div>

        <GrowthRoadmapSection audit={audit} />

        {audit.generatedContent && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Sparkles className="size-5 text-brand" /> {t("report.generatedImprovements")}
              </h2>
              <Badge variant="outline" className="rounded-full">
                {audit.generatedContent.source === "gemini"
                  ? t("report.generatedSourceGemini")
                  : t("report.generatedSourcePage")}
              </Badge>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">
                {t("report.generatedTitle")}
              </div>
              <p className="text-sm font-semibold">{audit.generatedContent.title}</p>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">
                {t("report.generatedDescription")}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                {audit.generatedContent.description}
              </p>
            </div>
            {audit.generatedContent.faq.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">
                  {t("generate.faqTab")} ({audit.generatedContent.faq.length})
                </div>
                <ul className="text-sm space-y-1">
                  {audit.generatedContent.faq.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-muted-foreground">
                      • {f.q}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button asChild size="sm" className="rounded-full">
              <Link href={`/audit/${auditId}/generate`}>{t("report.openFullGenerator")}</Link>
            </Button>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl gradient-brand p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-20" />
          <div className="relative">
            <h3 className="font-display text-2xl font-bold">{t("report.applyFixes")}</h3>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button asChild variant="secondary" className="rounded-full font-semibold">
                <Link href={`/audit/${auditId}/generate`}>{t("report.aiGenerator")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Link href={`/audit/${auditId}/compare`}>
                  {t("compare.title")} <ArrowRight className="size-4 ms-1 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}

const ROADMAP_HORIZON_META: Record<
  RoadmapHorizon,
  { titleKey: TranslationKey; icon: string }
> = {
  today: { titleKey: "report.roadmapToday", icon: "🚀" },
  week: { titleKey: "report.roadmapWeek", icon: "📅" },
  month: { titleKey: "report.roadmapMonth", icon: "📈" },
  longterm: { titleKey: "report.roadmapLongterm", icon: "🎯" },
};

const ROADMAP_PRIORITY_KEYS: Record<RoadmapPriority, TranslationKey> = {
  p1: "report.roadmapPriorityP1",
  p2: "report.roadmapPriorityP2",
  p3: "report.roadmapPriorityP3",
};

const ROADMAP_DIFFICULTY_KEYS: Record<RoadmapDifficulty, TranslationKey> = {
  easy: "report.roadmapDifficultyEasy",
  medium: "report.roadmapDifficultyMedium",
  hard: "report.roadmapDifficultyHard",
};

function roadmapStorageKey(auditId: string): string {
  return `storepulse:growth-roadmap:${auditId}`;
}

function GrowthRoadmapSection({ audit }: { audit: AuditData }) {
  const t = useT();
  const roadmap = React.useMemo(() => buildGrowthRoadmap(audit), [audit]);
  const auditId = audit.id ?? "demo";
  const [done, setDone] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(roadmapStorageKey(auditId));
      if (!raw) {
        setDone({});
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      setDone(parsed && typeof parsed === "object" ? parsed : {});
    } catch {
      setDone({});
    }
  }, [auditId]);

  const toggleDone = (taskId: string, checked: boolean) => {
    setDone((prev) => {
      const next = { ...prev, [taskId]: checked };
      try {
        window.localStorage.setItem(roadmapStorageKey(auditId), JSON.stringify(next));
      } catch {
        // Ignore quota / private-mode failures — UI state still updates.
      }
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 blur-3xl rounded-full -z-0" />
      <div className="relative space-y-6">
        <div>
          <Badge
            variant="outline"
            className="rounded-full mb-3 gap-1.5 border-primary/30 bg-primary/5 text-primary"
          >
            <Target className="size-3" /> {t("report.roadmap")}
          </Badge>
          <h2 className="font-display text-2xl font-bold">{t("report.roadmap")}</h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {t("report.roadmapSubtitle")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{t("report.roadmapSortedByRoi")}</p>
        </div>

        <div className="space-y-5">
          {ROADMAP_HORIZON_ORDER.map((horizon) => {
            const meta = ROADMAP_HORIZON_META[horizon];
            const tasks = roadmap[horizon];
            return (
              <div
                key={horizon}
                className="rounded-2xl border border-border/60 bg-background/50 p-5"
              >
                <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
                  <span aria-hidden>{meta.icon}</span>
                  {t(meta.titleKey)}
                  <Badge variant="outline" className="rounded-full text-[11px] ms-1">
                    {tasks.length}
                  </Badge>
                </h3>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("report.roadmapEmpty")}</p>
                ) : (
                  <ul className="space-y-3">
                    {tasks.map((task) => (
                      <GrowthRoadmapTaskCard
                        key={task.id}
                        task={task}
                        checked={Boolean(done[task.id])}
                        onCheckedChange={(checked) => toggleDone(task.id, checked)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function GrowthRoadmapTaskCard({
  task,
  checked,
  onCheckedChange,
}: {
  task: GrowthRoadmapTask;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const t = useT();
  const checkboxId = `roadmap-${task.id}`;

  return (
    <li
      className={cn(
        "rounded-xl border border-border/50 bg-card p-4 transition-opacity",
        checked && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={(value) => onCheckedChange(value === true)}
            aria-label={t("report.roadmapProgress")}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <label
            htmlFor={checkboxId}
            className={cn(
              "font-semibold text-sm leading-relaxed cursor-pointer block",
              checked && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full text-[11px]">
              {t("report.roadmapPriority")}: {t(ROADMAP_PRIORITY_KEYS[task.priority])}
            </Badge>
            <Badge variant="outline" className="rounded-full text-[11px]">
              {t("report.roadmapBusinessImpact")}: {t(impactLabelKey(task.businessImpact))}
            </Badge>
            <Badge variant="outline" className="rounded-full text-[11px]">
              {t("report.roadmapEstimatedTime")}: {task.estimatedTime}
            </Badge>
            <Badge variant="outline" className="rounded-full text-[11px]">
              {t("report.roadmapDifficulty")}: {t(ROADMAP_DIFFICULTY_KEYS[task.difficulty])}
            </Badge>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
              {t("report.roadmapExpectedResult")}
            </div>
            <p className="mt-1 text-sm leading-relaxed">{task.expectedResult}</p>
          </div>
        </div>
      </div>
    </li>
  );
}

const EST_IMPACT_LEVEL_KEYS: Record<QualitativeImpactLevel, TranslationKey> = {
  low: "report.estImpactLevelLow",
  medium: "report.estImpactLevelMedium",
  high: "report.estImpactLevelHigh",
  very_high: "report.estImpactLevelVeryHigh",
};

const EST_IMPACT_TITLE_KEYS: Record<QualitativeImpactItem["id"], TranslationKey> = {
  conversion: "report.estImpactConversion",
  trust: "report.estImpactTrust",
  seo: "report.estImpactSeo",
  geo: "report.estImpactAi",
  revenue: "report.estImpactRevenue",
};

const EST_IMPACT_ICONS: Record<QualitativeImpactItem["id"], PillarIcon> = {
  conversion: Zap,
  trust: ShieldCheck,
  seo: Search,
  geo: Bot,
  revenue: TrendingUp,
};

const EST_IMPACT_TONES: Record<QualitativeImpactLevel, string> = {
  low: "bg-muted text-muted-foreground border-border/60",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  high: "bg-primary/10 text-primary border-primary/30",
  very_high: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

const QUICK_WIN_DIFFICULTY_KEYS: Record<QuickWinDifficulty, TranslationKey> = {
  easy: "report.quickWinsDifficultyEasy",
  medium: "report.quickWinsDifficultyMedium",
};

function QuickWinsSection({ audit }: { audit: AuditData }) {
  const t = useT();
  const [open, setOpen] = React.useState<QuickWinTask[]>([]);
  const [completed, setCompleted] = React.useState<QuickWinTask[]>([]);

  React.useEffect(() => {
    const resolved = resolveQuickWinsWithCompletion(audit);
    setOpen(resolved.open);
    setCompleted(resolved.completed);
  }, [audit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16 }}
      className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand/10 blur-3xl rounded-full -z-0" />
      <div className="relative space-y-6">
        <div>
          <Badge
            variant="outline"
            className="rounded-full mb-3 gap-1.5 border-brand/30 bg-brand/5 text-brand"
          >
            <Zap className="size-3" /> {t("report.quickWins")}
          </Badge>
          <h2 className="font-display text-2xl font-bold">{t("report.quickWins")}</h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {t("report.quickWinsSubtitle")}
          </p>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            {t("report.quickWinsOpen")}
          </h3>
          {open.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-2xl border border-border/60 bg-background/50 p-5">
              {t("report.quickWinsEmpty")}
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {open.map((task) => (
                <QuickWinCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
            <Check className="size-4 text-primary" />
            {t("report.quickWinsCompleted")}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            {t("report.quickWinsCompletedHint")}
          </p>
          {completed.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-2xl border border-border/60 bg-background/50 p-5">
              {t("report.quickWinsCompletedEmpty")}
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {completed.map((task) => (
                <QuickWinCard key={`done-${task.fingerprint}`} task={task} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function QuickWinCard({ task }: { task: QuickWinTask }) {
  const t = useT();

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-background/50 p-5 space-y-3",
        task.completed && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4
          className={cn(
            "font-semibold text-sm leading-relaxed",
            task.completed && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </h4>
        {task.completed && (
          <Badge
            variant="outline"
            className="rounded-full shrink-0 text-[11px] border-primary/30 bg-primary/10 text-primary"
          >
            {t("report.quickWinsDoneBadge")}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full text-[11px]">
          {t("report.quickWinsEstimatedTime")}: {task.estimatedTime}
        </Badge>
        <Badge variant="outline" className="rounded-full text-[11px]">
          {t("report.quickWinsDifficulty")}: {t(QUICK_WIN_DIFFICULTY_KEYS[task.difficulty])}
        </Badge>
        <Badge variant="outline" className="rounded-full text-[11px]">
          {t("report.quickWinsBusinessImpact")}: {t(impactLabelKey(task.businessImpact))}
        </Badge>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-3.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
          {t("report.quickWinsSteps")}
        </div>
        <ol className="space-y-1.5 list-decimal list-inside">
          {task.steps.map((step, i) => (
            <li key={i} className="text-sm leading-relaxed text-foreground/90">
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function EstimatedBusinessImpactSection({ audit }: { audit: AuditData }) {
  const t = useT();
  const model: EstimatedBusinessImpactModel = React.useMemo(
    () => buildEstimatedBusinessImpact(audit),
    [audit]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 }}
      className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 blur-3xl rounded-full -z-0" />
      <div className="relative space-y-5">
        <div>
          <Badge
            variant="outline"
            className="rounded-full mb-3 gap-1.5 border-primary/30 bg-primary/5 text-primary"
          >
            <TrendingUp className="size-3" /> {t("report.estImpact")}
          </Badge>
          <h2 className="font-display text-2xl font-bold">{t("report.estImpact")}</h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {t("report.estImpactSubtitle")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("report.estImpactQualitativeNote")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {model.items.map((item) => {
            const Icon = EST_IMPACT_ICONS[item.id];
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border border-border/60 bg-background/50 p-5",
                  item.id === "revenue" && "sm:col-span-2 xl:col-span-1"
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="size-9 rounded-lg grid place-items-center shrink-0 bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <h3 className="font-display text-base font-bold leading-snug">
                      {t(EST_IMPACT_TITLE_KEYS[item.id])}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full shrink-0 text-[11px] font-bold",
                      EST_IMPACT_TONES[item.level]
                    )}
                  >
                    {t(EST_IMPACT_LEVEL_KEYS[item.level])}
                  </Badge>
                </div>
                {item.currentScore != null && (
                  <p className="text-[11px] text-muted-foreground mb-2">
                    {t("report.estImpactScoreHint", { score: item.currentScore })}
                  </p>
                )}
                <div className="rounded-xl border border-border/50 bg-card p-3.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                    {t("report.estImpactWhy")}
                  </div>
                  <p className="text-sm leading-relaxed">{item.reason}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function AiRecommendationSimulator({ audit }: { audit: AuditData }) {
  const t = useT();
  const [prompt, setPrompt] = React.useState(AI_SIMULATOR_EXAMPLE_PROMPTS[0] ?? "");
  const [result, setResult] = React.useState<SimulatedAiResponse | null>(() =>
    simulateAiRecommendation(audit, AI_SIMULATOR_EXAMPLE_PROMPTS[0] ?? "")
  );

  const runSimulation = (nextPrompt: string) => {
    const trimmed = nextPrompt.trim();
    if (!trimmed) {
      setResult(null);
      return;
    }
    setResult(simulateAiRecommendation(audit, trimmed));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand/10 blur-3xl rounded-full -z-0" />
      <div className="relative space-y-6">
        <div>
          <Badge
            variant="outline"
            className="rounded-full mb-3 gap-1.5 border-brand/30 bg-brand/5 text-brand"
          >
            <Bot className="size-3" /> {t("report.simulator")}
          </Badge>
          <h2 className="font-display text-2xl font-bold">{t("report.simulator")}</h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {t("report.simulatorSubtitle")}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/50 p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground">
              {t("report.simulatorPromptLabel")}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runSimulation(prompt);
                  }
                }}
                placeholder={t("report.simulatorPromptPlaceholder")}
                className="h-11 rounded-xl text-sm flex-1"
              />
              <Button
                type="button"
                className="rounded-full shrink-0"
                onClick={() => runSimulation(prompt)}
              >
                <Sparkles className="size-4 me-1.5" />
                {t("report.simulatorRun")}
              </Button>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {t("report.simulatorExamples")}
            </div>
            <div className="flex flex-wrap gap-2">
              {AI_SIMULATOR_EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setPrompt(example);
                    runSimulation(example);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    prompt === example
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("report.simulatorHint")}</p>
        </div>

        {result ? (
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="rounded-2xl border border-border/60 bg-background/50 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-lg font-bold flex items-center gap-2">
                  <Sparkles className="size-4 text-brand" />
                  {t("report.simulatorCurrentAnswer")}
                </h3>
                <div className="rounded-xl border border-border/50 bg-card px-3 py-2 flex items-center gap-3">
                  <ScoreRadial
                    score={result.confidence}
                    size={56}
                    stroke={6}
                    label={t("report.simulatorConfidence")}
                  />
                  <div>
                    <div className="text-[11px] text-muted-foreground">
                      {t("report.simulatorConfidence")}
                    </div>
                    <div className="font-display text-lg font-bold tabular-nums text-primary">
                      {result.confidence}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <p className="text-sm leading-relaxed font-medium">{result.answer}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-background/50 p-5">
                <h3 className="font-display text-base font-bold mb-3">
                  {t("report.simulatorWhy")}
                </h3>
                <ul className="space-y-2">
                  {result.reasons.map((reason, i) => (
                    <li
                      key={`reason-${i}`}
                      className="rounded-xl border border-border/50 bg-card p-3 text-sm leading-relaxed"
                    >
                      <span className="font-semibold text-primary me-2">{i + 1}.</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/50 p-5">
                <h3 className="font-display text-base font-bold mb-3 flex items-center gap-2">
                  <Wrench className="size-4 text-primary" />
                  {t("report.simulatorImprove")}
                </h3>
                <ul className="space-y-2">
                  {result.improvements.map((item, i) => (
                    <li
                      key={`improve-${i}`}
                      className="rounded-xl border border-border/50 bg-card p-3 text-sm leading-relaxed"
                    >
                      <span className="font-semibold text-brand me-2">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {t("report.simulatorFixFirst")}
                </div>
                <p className="mt-1.5 text-sm font-semibold leading-snug">{result.fixFirst}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-background/50 p-6 text-sm text-muted-foreground">
            {t("report.simulatorEmpty")}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const OVERALL_SCORE_COLOR = "#FF6600";

const BALANCE_LABEL_KEYS: Record<BalanceProfile, TranslationKey> = {
  balanced_strong: "report.overviewBalanceBalancedStrong",
  balanced_moderate: "report.overviewBalanceBalancedModerate",
  balanced_weak: "report.overviewBalanceBalancedWeak",
  unbalanced: "report.overviewBalanceUnbalanced",
};

function balanceExplanation(
  balance: OverviewBalance,
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
): string {
  switch (balance.profile) {
    case "balanced_strong":
    case "balanced_moderate":
    case "balanced_weak":
      return t(BALANCE_LABEL_KEYS[balance.profile]);
    case "unbalanced":
      return t(BALANCE_LABEL_KEYS.unbalanced, {
        strong: balance.strongest ? t(PILLAR_META[balance.strongest].labelKey) : "—",
        weak: balance.weakest ? t(PILLAR_META[balance.weakest].labelKey) : "—",
      });
    default: {
      const _exhaustive: never = balance.profile;
      return _exhaustive;
    }
  }
}

function ScoreOverviewSection({
  overallScore,
  breakdown,
}: {
  overallScore: number;
  breakdown: AuditData["breakdown"];
}) {
  const t = useT();
  const balance = describeScoreBalance(overallScore, breakdown);

  const pillarScores = (["conversion", "seo", "geo", "trust"] as const).map((pillar) => {
    const score = breakdown.find((b) => b.pillar === pillar)?.score ?? 0;
    return {
      pillar,
      score,
      label: t(PILLAR_META[pillar].labelKey),
      color: PILLAR_META[pillar].color,
      icon: PILLAR_META[pillar].icon,
    };
  });

  const radarData = [
    { axis: t("report.overviewOverall"), score: overallScore, fullMark: 100 },
    ...pillarScores.map((p) => ({
      axis: p.label,
      score: p.score,
      fullMark: 100,
    })),
  ];

  const legendItems = [
    {
      key: "overall",
      label: t("report.overviewOverall"),
      score: overallScore,
      color: OVERALL_SCORE_COLOR,
      icon: Gauge as PillarIcon,
    },
    ...pillarScores.map((p) => ({
      key: p.pillar,
      label: p.label,
      score: p.score,
      color: p.color,
      icon: p.icon,
    })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 blur-3xl rounded-full -z-0" />
      <div className="relative space-y-6">
        <div>
          <Badge
            variant="outline"
            className="rounded-full mb-3 gap-1.5 border-primary/30 bg-primary/5 text-primary"
          >
            <Target className="size-3" /> {t("report.overview")}
          </Badge>
          <h2 className="font-display text-2xl font-bold">{t("report.overview")}</h2>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {t("report.overviewSubtitle")}
          </p>
        </div>

        <div className="grid lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
          <div className="rounded-2xl border border-border/60 bg-background/50 p-5 flex flex-col items-center text-center">
            <ScoreRadial
              score={overallScore}
              size={150}
              stroke={11}
              label={t("report.overviewOverall")}
            />
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/50 p-4 sm:p-5 min-h-[280px]">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="oklch(0.7 0.01 250 / 0.35)" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name={t("report.overview")}
                  dataKey="score"
                  stroke={OVERALL_SCORE_COLOR}
                  fill={OVERALL_SCORE_COLOR}
                  fillOpacity={0.28}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(value: number) => [value, t("report.storeScore")]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid oklch(0.7 0.01 250 / 0.35)",
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/50 p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {t("report.overviewLegend")}
            </div>
            <ul className="space-y-2.5">
              {legendItems.map((item) => (
                <li
                  key={item.key}
                  className="rounded-xl border border-border/50 bg-card p-3 flex items-center gap-3"
                >
                  <span
                    className="size-9 rounded-lg grid place-items-center shrink-0"
                    style={{ background: `${item.color}1a`, color: item.color }}
                  >
                    <item.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{item.label}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ background: item.color }}
                      />
                      <span
                        className="font-display text-base font-bold tabular-nums"
                        style={{ color: item.color }}
                      >
                        {item.score}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-start">
          <p className="text-sm font-semibold leading-relaxed">
            {balanceExplanation(balance, t)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

const HEALTH_LABEL_KEYS: Record<StoreHealthBand, TranslationKey> = {
  excellent: "report.execHealthExcellent",
  good: "report.execHealthGood",
  fair: "report.execHealthFair",
  poor: "report.execHealthPoor",
};

const IMPACT_BAND_KEYS: Record<ImpactEstimate["band"], TranslationKey> = {
  high: "report.execImpactHigh",
  medium: "report.execImpactMedium",
  low: "report.execImpactLow",
};

function ExecutiveSummarySection({ summary }: { summary: ExecutiveSummaryModel }) {
  const t = useT();
  const healthKey = HEALTH_LABEL_KEYS[summary.healthBand];
  const impactCards: {
    key: string;
    titleKey: TranslationKey;
    icon: PillarIcon;
    impact: ImpactEstimate;
    tone: string;
  }[] = [
    {
      key: "business",
      titleKey: "report.execBusinessImpact",
      icon: Briefcase,
      impact: summary.businessImpact,
      tone: "bg-primary/10 text-primary",
    },
    {
      key: "geo",
      titleKey: "report.execAiVisibilityImpact",
      icon: Bot,
      impact: summary.aiVisibilityImpact,
      tone: "bg-brand/10 text-brand",
    },
    {
      key: "seo",
      titleKey: "report.execSeoImpact",
      icon: Search,
      impact: summary.seoImpact,
      tone: "bg-amber-500/10 text-amber-600",
    },
    {
      key: "conversion",
      titleKey: "report.execConversionImpact",
      icon: Zap,
      impact: summary.conversionImpact,
      tone: "bg-rose-500/10 text-rose-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 blur-3xl rounded-full -z-0" />
      <div className="relative space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge
              variant="outline"
              className="rounded-full mb-3 gap-1.5 border-primary/30 bg-primary/5 text-primary"
            >
              <Sparkles className="size-3" /> {t("report.execSummary")}
            </Badge>
            <h2 className="font-display text-2xl font-bold">{t("report.execSummary")}</h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-2xl">
              {t("report.execSummarySubtitle")}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-center">
          <div className="rounded-2xl border border-border/60 bg-background/50 p-5 flex flex-col items-center text-center">
            <ScoreRadial
              score={summary.overallScore}
              size={160}
              stroke={11}
              label={t("report.execOverallScore")}
            />
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/50 p-5 sm:p-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
              {t("report.storeScore")}
            </div>
            <p className="mt-2 font-display text-lg sm:text-xl font-bold leading-relaxed">
              {t(healthKey, { name: summary.storeName })}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/60 bg-background/50 p-5">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <span className="size-9 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0">
                <Check className="size-4" />
              </span>
              {t("report.execStrengths")}
            </h3>
            {summary.strengths.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {summary.strengths.map((item, i) => (
                  <li
                    key={`strength-${i}`}
                    className="rounded-xl border border-border/50 bg-card p-3.5 text-sm leading-relaxed"
                  >
                    <span className="font-semibold text-primary me-2">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {t("report.execNoStrengths")}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/50 p-5">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <span className="size-9 rounded-lg grid place-items-center bg-rose-500/10 text-rose-500 shrink-0">
                <AlertTriangle className="size-4" />
              </span>
              {t("report.execCriticalIssues")}
            </h3>
            {summary.criticalIssues.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {summary.criticalIssues.map((item, i) => (
                  <li
                    key={`issue-${i}`}
                    className="rounded-xl border border-border/50 bg-card p-3.5 text-sm leading-relaxed"
                  >
                    <span className="font-semibold text-rose-500 me-2">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {t("report.execNoCritical")}
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold mb-3">{t("report.execImpacts")}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {impactCards.map((card) => (
              <div
                key={card.key}
                className="rounded-2xl border border-border/60 bg-background/50 p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={cn(
                      "size-9 rounded-lg grid place-items-center shrink-0",
                      card.tone
                    )}
                  >
                    <card.icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm leading-snug">{t(card.titleKey)}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t(IMPACT_BAND_KEYS[card.impact.band])}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/50 bg-card p-3 space-y-1.5">
                  <div className="text-[11px] text-muted-foreground">
                    {t("report.execCurrentScore", { score: card.impact.score })}
                  </div>
                  <p className="text-sm font-semibold leading-snug">
                    {t("report.execImpactDetail", { points: card.impact.liftPoints })}
                  </p>
                  <div className="font-display text-lg font-bold tabular-nums text-primary">
                    {t("report.pointsValue", { count: card.impact.liftPoints })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function deriveSignalsFromAudit(audit: AuditData): PageSignals {
  const critical = audit.recommendations.filter((r) => r.severity === "critical");
  return {
    websiteDetected: Boolean(audit.productUrl),
    productPageDetected: /product/i.test(audit.productUrl) || Boolean(audit.productName),
    productImageDetected: false,
    pageTitle: audit.productName,
    errors: critical.slice(0, 5).map((r) => ({
      id: r.id,
      severity: "critical" as const,
      label: r.problem.slice(0, 80) + (r.problem.length > 80 ? "…" : ""),
      detail: r.solution,
    })),
  };
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/50 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold truncate mt-0.5" title={value}>
        {value}
      </div>
    </div>
  );
}

function PageSignalsPanel({
  signals,
  productUrl,
  productName,
}: {
  signals: PageSignals;
  productUrl: string;
  productName: string;
}) {
  const t = useT();

  const cards = [
    {
      id: "website",
      ok: signals.websiteDetected,
      icon: Globe2,
      titleKey: "report.signals.website" as const,
      okKey: "report.signals.websiteOk" as const,
      failKey: "report.signals.websiteFail" as const,
      preview: (
        <div className="mt-3 rounded-lg border border-border/50 bg-background/80 overflow-hidden">
          <div dir="ltr" className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/50 bg-muted/40">
            <span className="size-2 rounded-full bg-rose-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="ms-2 text-[10px] text-muted-foreground truncate">{productUrl}</span>
          </div>
          <div className="p-3 space-y-2">
            <div className="h-2 w-2/3 rounded bg-foreground/15" />
            <div className="h-2 w-full rounded bg-muted" />
            <div className="h-2 w-5/6 rounded bg-muted" />
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className="h-8 rounded bg-primary/15" />
              <div className="h-8 rounded bg-muted" />
              <div className="h-8 rounded bg-muted" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "product",
      ok: signals.productPageDetected,
      icon: Package,
      titleKey: "report.signals.product" as const,
      okKey: "report.signals.productOk" as const,
      failKey: "report.signals.productFail" as const,
      preview: (
        <div className="mt-3 rounded-lg border border-border/50 bg-background/80 p-3 space-y-2">
          <div className="text-xs font-semibold line-clamp-2">
            {productName || signals.pageTitle || t("report.productFallback")}
          </div>
          <div className="h-2 w-1/3 rounded bg-primary/40" />
          <div className="flex gap-2 pt-1">
            <div className="h-7 flex-1 rounded-md bg-primary/20" />
            <div className="h-7 w-16 rounded-md bg-muted" />
          </div>
        </div>
      ),
    },
    {
      id: "image",
      ok: signals.productImageDetected,
      icon: ImageIcon,
      titleKey: "report.signals.image" as const,
      okKey: "report.signals.imageOk" as const,
      failKey: "report.signals.imageFail" as const,
      preview: signals.productImageUrl ? (
        <div className="mt-3 rounded-lg border border-border/50 overflow-hidden bg-muted/30 aspect-square max-h-36">
          <img
            src={signals.productImageUrl}
            alt={productName || t("report.productFallback")}
            className="size-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-rose-400/40 bg-rose-500/5 aspect-square max-h-36 grid place-items-center">
          <ImageIcon className="size-8 text-rose-400/70" />
        </div>
      ),
    },
  ] as const;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold">{t("report.signals.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("report.signals.subtitle")}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.18, type: "spring", stiffness: 260, damping: 22 }}
            className={cn(
              "rounded-2xl border p-4 shadow-sm relative overflow-hidden",
              card.ok
                ? "border-primary/30 bg-card"
                : "border-rose-500/40 bg-rose-500/[0.04] ring-1 ring-rose-500/20"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "size-10 rounded-xl grid place-items-center",
                    card.ok ? "bg-primary/10 text-primary" : "bg-rose-500/15 text-rose-500"
                  )}
                >
                  <card.icon className="size-5" />
                </span>
                <div>
                  <div className="text-sm font-semibold">{t(card.titleKey)}</div>
                  <div
                    className={cn(
                      "text-[11px] mt-0.5",
                      card.ok ? "text-primary" : "text-rose-500 font-semibold"
                    )}
                  >
                    {t(card.ok ? card.okKey : card.failKey)}
                  </div>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full text-[10px] shrink-0",
                  card.ok
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-rose-500/40 bg-rose-500/10 text-rose-600"
                )}
              >
                {card.ok ? (
                  <span className="inline-flex items-center gap-1">
                    <Check className="size-3" /> {t("report.signals.detected")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <X className="size-3" /> {t("report.signals.missing")}
                  </span>
                )}
              </Badge>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 + i * 0.18 }}
            >
              {card.preview}
            </motion.div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={cn(
          "rounded-2xl border p-5",
          signals.errors.length
            ? "border-rose-500/40 bg-gradient-to-br from-rose-500/[0.07] to-transparent"
            : "border-border/60 bg-card"
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className={cn("size-5", signals.errors.length ? "text-rose-500" : "text-primary")} />
          <h3 className="font-display text-lg font-bold">{t("report.errors.title")}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{t("report.errors.subtitle")}</p>

        {signals.errors.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("report.errors.empty")}</p>
        ) : (
          <ul className="space-y-2.5">
            {signals.errors.map((err, i) => (
              <motion.li
                key={err.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.78 + i * 0.06 }}
                className={cn(
                  "rounded-xl border p-3.5 flex gap-3",
                  err.severity === "critical"
                    ? "border-rose-500/50 bg-rose-500/10 shadow-[0_0_0_1px_rgba(244,63,94,0.12)]"
                    : "border-amber-500/40 bg-amber-500/10"
                )}
              >
                <span
                  className={cn(
                    "size-8 rounded-lg grid place-items-center shrink-0 mt-0.5",
                    err.severity === "critical" ? "bg-rose-500/20 text-rose-600" : "bg-amber-500/20 text-amber-700"
                  )}
                >
                  <X className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{err.label}</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        err.severity === "critical"
                          ? "bg-rose-500/15 text-rose-600"
                          : "bg-amber-500/15 text-amber-700"
                      )}
                    >
                      {t(err.severity === "critical" ? "severity.critical" : "severity.warning")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{err.detail}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const t = useT();
  const meta = PILLAR_META[rec.pillar];
  const isCritical = rec.severity === "critical";
  const isQuickWin = Boolean(rec.quickWin) || index < 3;
  const rank = rec.priorityRank ?? index + 1;
  const impactKey = impactLabelKey(rec.impact);
  const badgeLevel = priorityBadgeLevel(rec);
  const badgeLabelKey = priorityBadgeLabelKey(badgeLevel);
  const view = buildConsultantRecommendationView(rec);
  const [copying, setCopying] = React.useState(false);

  const handleCopy = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const text = formatRecommendationCopy(rec, {
        priority: t("report.priority"),
        rank,
        whatIsWrong: t("report.whatIsWrong"),
        whyItMatters: t("report.whyItMatters"),
        ifIgnored: t("report.ifIgnored"),
        howToFix: t("report.howToFix"),
        howLong: t("report.howLong"),
        businessImpact: t("report.businessImpact"),
        timeValue: view.howLong,
        businessDetail: view.businessImpact,
      });
      await navigator.clipboard.writeText(text);
      toast.success(t("report.copiedFix"));
    } catch {
      toast.error(t("report.copyFailed"));
    } finally {
      setCopying(false);
    }
  };

  const narrativeBlocks: {
    key: string;
    titleKey: TranslationKey;
    body: string;
    tone: "rose" | "amber" | "primary" | "muted";
    icon: PillarIcon;
  }[] = [
    {
      key: "wrong",
      titleKey: "report.whatIsWrong",
      body: view.whatIsWrong,
      tone: "rose",
      icon: AlertTriangle,
    },
    {
      key: "why",
      titleKey: "report.whyItMatters",
      body: view.whyItMatters,
      tone: "amber",
      icon: Target,
    },
    {
      key: "ignore",
      titleKey: "report.ifIgnored",
      body: view.ifIgnored,
      tone: "rose",
      icon: X,
    },
    {
      key: "fix",
      titleKey: "report.howToFix",
      body: view.howToFix,
      tone: "primary",
      icon: Wrench,
    },
  ];

  const toneClass = {
    rose: "bg-rose-500/15 text-rose-500",
    amber: "bg-amber-500/15 text-amber-600",
    primary: "bg-primary/15 text-primary",
    muted: "bg-muted text-muted-foreground",
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      className={cn(
        "rounded-2xl border bg-card overflow-hidden",
        isQuickWin
          ? "border-primary/45 ring-1 ring-primary/20 shadow-[0_0_24px_-8px_rgba(255,102,0,0.28)]"
          : isCritical
            ? "border-rose-500/50 ring-1 ring-rose-500/25 shadow-[0_0_24px_-8px_rgba(244,63,94,0.35)]"
            : "border-border/60"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-4 py-3 border-b",
          isQuickWin
            ? "border-primary/25 bg-primary/10"
            : isCritical
              ? "border-rose-500/30 bg-rose-500/10"
              : "border-border/60 bg-muted/30"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-background/80 text-xs font-bold tabular-nums">
            {rank}
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("report.priorityRank", { rank })}
            </div>
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: meta.color }}>
                {t(view.categoryKey)}
              </span>
              {isQuickWin && (
                <span className="shrink-0 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {t("report.startWithThis")}
                </span>
              )}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full border",
            priorityBadgeClass(badgeLevel)
          )}
        >
          {t("report.priority")}: {t(badgeLabelKey)}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {narrativeBlocks.map((block) => (
          <div key={block.key} className="flex gap-2.5">
            <span
              className={cn(
                "size-5 rounded-full grid place-items-center shrink-0 mt-0.5",
                toneClass[block.tone]
              )}
            >
              <block.icon className="size-3" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-foreground/80 mb-0.5">
                {t(block.titleKey)}
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{block.body}</p>
            </div>
          </div>
        ))}

        <div className="grid sm:grid-cols-2 gap-2 pt-1">
          <div className="rounded-xl border border-border/50 bg-background/50 px-3 py-2.5">
            <div className="text-[11px] font-bold text-muted-foreground mb-1">
              {t("report.howLong")}
            </div>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground shrink-0" />
              {view.howLong}
            </div>
          </div>
          <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5">
            <div className="text-[11px] font-bold text-primary mb-1">
              {t("report.businessImpact")}
            </div>
            <p className="text-sm font-semibold leading-relaxed flex items-start gap-1.5">
              <Briefcase className="size-3.5 text-primary shrink-0 mt-0.5" />
              <span>
                <span className="text-primary">{t(impactKey)}</span>
                {" — "}
                {view.businessImpact}
              </span>
            </p>
          </div>
        </div>

        {(rec.beforePreview || rec.afterPreview) && (
          <div className="grid sm:grid-cols-2 gap-2 rounded-xl border border-border/50 bg-muted/15 p-3">
            {rec.beforePreview && (
              <div>
                <div className="text-[11px] font-bold text-muted-foreground mb-1">
                  {t("report.beforeLabel")}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {rec.beforePreview}
                </p>
              </div>
            )}
            {rec.afterPreview && (
              <div>
                <div className="text-[11px] font-bold text-primary mb-1">
                  {t("report.afterLabel")}
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {rec.afterPreview}
                </p>
              </div>
            )}
          </div>
        )}

        {rec.affectedPage && (
          <p className="text-[11px] text-muted-foreground truncate">
            <span className="font-semibold">{t("report.pageArea")}: </span>
            <span dir="ltr">{rec.affectedPage}</span>
          </p>
        )}
      </div>

      <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex flex-wrap items-center gap-2 text-[11px]">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 font-bold",
            priorityBadgeClass(badgeLevel)
          )}
        >
          {t(badgeLabelKey)}
        </span>
        <span className="text-muted-foreground">· {t(view.categoryKey)}</span>
        <span className="text-muted-foreground">· {view.howLong}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ms-auto h-7 px-2 text-[11px] rounded-full"
          disabled={copying}
          onClick={() => void handleCopy()}
        >
          {copying ? (
            <Check className="size-3 me-1" />
          ) : (
            <Copy className="size-3 me-1" />
          )}
          {t("report.copyFix")}
        </Button>
      </div>
    </motion.div>
  );
}
