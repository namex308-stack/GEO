"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
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
} from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRadial, ScoreBar } from "@/components/common/score-viz";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";
import { prioritizeRecommendations } from "@/lib/ai/recommendations";
import type { AuditData, PageSignals, Recommendation, ScorePillar } from "@/lib/types";

type PillarIcon = typeof Zap;

const PILLAR_META: Record<
  ScorePillar,
  { icon: PillarIcon; color: string; labelKey: TranslationKey }
> = {
  conversion: { icon: Zap, color: "#FF6600", labelKey: "pillar.conversion" },
  seo: { icon: Search, color: "#ff983f", labelKey: "pillar.seo" },
  geo: { icon: Bot, color: "#cc5200", labelKey: "pillar.geo" },
  trust: { icon: ShieldCheck, color: "#929292", labelKey: "pillar.trust" },
};

const SEVERITY_CLASS: Record<Recommendation["severity"], string> = {
  critical: "bg-rose-500/10 text-rose-500",
  warning: "bg-amber-500/10 text-amber-600",
  opportunity: "bg-primary/10 text-primary",
};

export type AuditReportProps = {
  audit?: AuditData | null;
  demoMode?: boolean;
  aiConfigured?: boolean;
};

export function AuditReport({
  audit,
  demoMode = false,
  aiConfigured = true,
}: AuditReportProps) {
  const t = useT();

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
          className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 blur-3xl rounded-full -z-0" />
          <div className="relative grid lg:grid-cols-[auto_1fr] gap-8 items-center">
            <div className="flex flex-col items-center text-center">
              <ScoreRadial score={audit.overallScore} size={180} stroke={12} label={t("report.storeScore")} />
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
                      tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12, fontWeight: 600 }}
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
                    <Bar dataKey="competitor" radius={[0, 6, 6, 0]} fill="oklch(0.63 0 0 / 0.35)" barSize={14} />
                    <Bar dataKey="you" radius={[0, 6, 6, 0]} fill="#FF6600" barSize={14} />
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
              <p className="mt-3 text-sm text-muted-foreground">
                Add a competitor URL on the next audit to unlock side-by-side scores.
              </p>
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
              {[
                { n: "ChatGPT", s: audit.geoReadability.chatgpt },
                { n: "Perplexity", s: audit.geoReadability.perplexity },
                { n: "Google AI", s: audit.geoReadability.googleAI },
              ].map((g) => (
                <div key={g.n} className="text-center rounded-xl border border-border/50 bg-background/40 p-4">
                  <ScoreRadial score={g.s} size={88} stroke={7} gold />
                  <div className="text-xs font-semibold mt-2">{g.n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

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
              {t("report.priorityListHint")}
            </p>
          )}
        </div>
        {audit.generatedContent && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Sparkles className="size-5 text-brand" /> AI-generated improvements
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
          <div dir="ltr" className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/40 bg-muted/40">
            <span className="size-2 rounded-full bg-rose-400" />
            <span className="size-2 rounded-full bg-amber-400" />
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="ml-2 text-[10px] text-muted-foreground truncate">{productUrl}</span>
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
  const severityKey =
    rec.severity === "critical"
      ? ("severity.critical" as TranslationKey)
      : rec.severity === "warning"
        ? ("severity.warning" as TranslationKey)
        : ("severity.opportunity" as TranslationKey);
  const isCritical = rec.severity === "critical";
  const isQuickWin = Boolean(rec.quickWin) || index < 3;
  const rank = rec.priorityRank ?? index + 1;

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
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-background/80 text-[11px] font-bold tabular-nums">
            {rank}
          </span>
          <span className="text-xs font-semibold truncate">{t(meta.labelKey)}</span>
          {isQuickWin && (
            <span className="shrink-0 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              {t("report.startWithThis")}
            </span>
          )}
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${SEVERITY_CLASS[rec.severity]}`}
        >
          {t(severityKey)}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex gap-2.5">
          <span className="size-5 rounded-full bg-rose-500/15 grid place-items-center shrink-0 mt-0.5">
            <X className="size-3 text-rose-500" />
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase text-rose-500 mb-0.5">{t("report.problem")}</div>
            <p className={cn("text-sm", isCritical || isQuickWin ? "text-foreground font-medium" : "text-muted-foreground")}>
              {rec.problem}
            </p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <span className="size-5 rounded-full bg-primary/15 grid place-items-center shrink-0 mt-0.5">
            <Check className="size-3 text-primary" />
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase text-primary mb-0.5">{t("report.solution")}</div>
            <p className="text-sm text-foreground/90">{rec.solution}</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center gap-2 text-[11px]">
        <Target className="size-3" /> {t("report.highImpact")} · <Clock className="size-3" />{" "}
        {t("report.quickFix")}
        <Button size="sm" variant="ghost" className="ms-auto h-7 px-2 text-[11px] rounded-full">
          <Copy className="size-3 me-1" /> {t("report.copyFix")}
        </Button>
      </div>
    </motion.div>
  );
}

/** @deprecated Prefer named export AuditReport */
export default AuditReport;
