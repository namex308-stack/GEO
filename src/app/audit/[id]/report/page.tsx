"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Zap, Search, Bot, ShieldCheck, ArrowRight, TrendingUp, RotateCcw, Sparkles, Crown, Gauge, ListChecks, Loader2, FileDown, Eye, AlertTriangle } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { IssueCard } from "@/components/audit/IssueCard";
import { GuidedFlowRail } from "@/components/audit/guided-flow-rail";
import { CustomerEyeTestCard } from "@/components/audit/customer-eye-test";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRadial, ScoreBar } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";
import { useAuditOrRedirect } from "@/hooks/use-audit-loader";
import { useUserPlan } from "@/hooks/use-user-plan";
import { canAccessFeature } from "@/lib/plan-gates";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ScoreBreakdown, Recommendation } from "@/lib/types";
import { crumbsForPath } from "@/lib/nav-config";
import {
  getFlowStep,
  isGuidedFlowComplete,
  patchFlowState,
  type FlowStep,
} from "@/lib/workflow/flow-state";

const PILLAR_ICONS: Record<string, typeof Zap> = {
  conversion: Zap, seo: Search, geo: Bot, trust: ShieldCheck,
};
const PILLAR_COLORS: Record<string, string> = {
  conversion: "#FF6600", seo: "#ff983f", geo: "#cc5200", trust: "#929292",
};

export default function ReportPage() {
  const t = useT();
  const params = useParams();
  const auditId = params.id as string;

  const { audit: resolvedAudit, loading: isLoading } = useAuditOrRedirect(auditId);
  const { plan: userPlan } = useUserPlan();
  const [guided, setGuided] = React.useState(false);
  const [flowStep, setFlowStep] = React.useState<FlowStep>("report");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding");
        if (!res.ok) return;
        const data = await res.json();
        const ob = (data.onboarding as Record<string, string> | null) ?? null;
        if (cancelled) return;
        if (!isGuidedFlowComplete(ob)) {
          setGuided(true);
          const step = getFlowStep(ob);
          setFlowStep(
            step === "scanning" || step === "quiz" || step === "connect" || step === "audit"
              ? "report"
              : step
          );
          void patchFlowState({ lastAuditId: auditId, flowStep: "report" });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auditId]);

  if (isLoading || !resolvedAudit) {
    return (
      <PageShell>
        <PageContent className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </PageContent>
      </PageShell>
    );
  }

  const breakdown = resolvedAudit.breakdown ?? [];
  const recommendations = resolvedAudit.recommendations ?? [];
  const priorityFixes = recommendations.filter(
    (r) => r.severity === "critical" || r.severity === "warning"
  );
  const criticalCount = recommendations.filter((r) => r.severity === "critical").length;
  const hasCompetitor = !!resolvedAudit.competitorUrl && (resolvedAudit.competitorBreakdown?.length ?? 0) > 0;

  const comparisonData = hasCompetitor
    ? breakdown.map((b) => {
        const comp = resolvedAudit.competitorBreakdown?.find((c) => c.pillar === b.pillar);
        return { pillar: b.label, you: b.score, competitor: comp?.score ?? 0 };
      })
    : [];

  const scoreDelta = resolvedAudit.competitorScore
    ? resolvedAudit.overallScore - resolvedAudit.competitorScore
    : 0;

  return (
    <PageShell>
      <PageHeader
        title={t("report.title")}
        subtitle={resolvedAudit.productUrl}
        icon={Gauge}
        back="/dashboard"
        crumbs={crumbsForPath(`/audit/${auditId}/report`, { reportId: auditId })}
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full hidden sm:inline-flex"
              id="guided-export"
              onClick={() => {
                if (!canAccessFeature(userPlan, "pdf")) {
                  toast.error(t("planGate.pdfDenied"));
                  return;
                }
                window.open(`/api/audit/${auditId}/pdf`, "_blank");
                if (guided) {
                  void patchFlowState({
                    flowComplete: "true",
                    flowStep: "done",
                    lastAuditId: auditId,
                  });
                }
              }}
            >
              <FileDown className="size-4 ml-1" /> {t("report.downloadPdf")}
            </Button>
            {resolvedAudit.crawlSummary && (
              <Button variant="ghost" size="sm" className="rounded-full hidden sm:inline-flex" onClick={async () => {
                if (!canAccessFeature(userPlan, "watchdog")) {
                  toast.error(t("planGate.upgradeMessage", { feature: t("planGate.feature.watchdog") }));
                  return;
                }
                const res = await fetch("/api/monitoring", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ siteUrl: resolvedAudit.storeUrl || resolvedAudit.productUrl, storeUrl: resolvedAudit.storeUrl, productUrl: resolvedAudit.productUrl, label: resolvedAudit.storeName }),
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok) toast.success("Weekly monitoring enabled");
                else toast.error(data.error || "Could not enable monitoring");
              }}><Eye className="size-4 ml-1" /> Monitor weekly</Button>
            )}
            <Button variant="ghost" size="sm" className="rounded-full hidden sm:inline-flex" onClick={() => toast.info("Re-audit coming in a future update")}><RotateCcw className="size-4 ml-1" /> {t("report.reaudit")}</Button>
            <Button asChild size="sm" className="rounded-full"><Link href={`/audit/${auditId}/generate`}><Sparkles className="size-4 ml-1" /> {t("report.aiGenerator")}</Link></Button>
          </>
        }
      />
      <PageContent className={cn("space-y-8", guided && "pb-28")}>
        {resolvedAudit.aiEnhanced === false && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex gap-3"
          >
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{t("report.aiFallbackTitle")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("report.aiFallbackDesc")}</p>
            </div>
          </motion.div>
        )}

        {/* Executive summary */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 blur-3xl rounded-full -z-0" />
          <div className="relative grid lg:grid-cols-[auto_1fr] gap-8 items-center">
            <div className="flex flex-col items-center text-center">
              <ScoreRadial score={resolvedAudit.overallScore} size={180} stroke={12} label={t("report.storeScore")} />
              {scoreDelta !== 0 && (
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  <TrendingUp className="size-4" /> {t("report.vsCompetitor", { count: Math.abs(scoreDelta) })}
                </div>
              )}
            </div>
            <div>
              <Badge variant="outline" className="rounded-full mb-3 gap-1.5 border-primary/30 bg-primary/5 text-primary"><Sparkles className="size-3" /> {t("report.auditComplete")}</Badge>
              <h1 className="font-display text-2xl font-bold">{resolvedAudit.productName}</h1>
              <p className="mt-1 text-sm text-muted-foreground break-all">{resolvedAudit.productUrl}</p>
              <div className="mt-5 grid sm:grid-cols-3 gap-3">
                {[
                  { icon: Zap, label: t("report.criticalIssues"), value: String(criticalCount), tone: "rose" as const },
                  { icon: TrendingUp, label: t("report.projectedLift"), value: t("report.pointsValue", { count: Math.min(recommendations.length * 4, 40) }), tone: "primary" as const },
                  { icon: ListChecks, label: t("report.recommendations"), value: String(recommendations.length), tone: "brand" as const },
                ].map((s, i) => {
                  const colors = { rose: "bg-rose-500/10 text-rose-500", primary: "bg-primary/10 text-primary", brand: "bg-brand/10 text-brand" };
                  return (
                    <div key={i} className="rounded-xl border border-border/50 bg-background/50 p-3.5 flex items-center gap-3">
                      <span className={`size-9 rounded-lg grid place-items-center shrink-0 ${colors[s.tone]}`}><s.icon className="size-5" /></span>
                      <div><div className="font-display text-lg font-bold tabular-nums">{s.value}</div><div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {resolvedAudit.crawlSummary && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/60 bg-card p-6">
            <h2 className="font-display text-xl font-bold mb-4">Full Site Crawl Summary</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border/50 p-4 text-center">
                <div className="text-2xl font-bold">{resolvedAudit.crawlSummary.totalPages}</div>
                <div className="text-xs text-muted-foreground mt-1">Pages analyzed</div>
              </div>
              <div className="rounded-xl border border-border/50 p-4 text-center">
                <div className="text-2xl font-bold text-rose-500">{resolvedAudit.crawlSummary.pagesWithIssues}</div>
                <div className="text-xs text-muted-foreground mt-1">Pages with issues</div>
              </div>
              <div className="rounded-xl border border-border/50 p-4 text-center">
                <div className="text-2xl font-bold text-primary">{resolvedAudit.crawlSummary.averageScore}</div>
                <div className="text-xs text-muted-foreground mt-1">Average score</div>
              </div>
              <div className="rounded-xl border border-border/50 p-4 text-center">
                <div className="text-2xl font-bold">{resolvedAudit.crawlSummary.bestPage?.score ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">Best page score</div>
              </div>
            </div>
            {(resolvedAudit.crawlSummary.bestPage || resolvedAudit.crawlSummary.worstPage) && (
              <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                {resolvedAudit.crawlSummary.bestPage && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                    <div className="text-xs font-bold text-primary mb-1">Best page</div>
                    <div className="font-semibold">{resolvedAudit.crawlSummary.bestPage.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{resolvedAudit.crawlSummary.bestPage.url}</div>
                  </div>
                )}
                {resolvedAudit.crawlSummary.worstPage && (
                  <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 p-3">
                    <div className="text-xs font-bold text-rose-500 mb-1">Worst page</div>
                    <div className="font-semibold">{resolvedAudit.crawlSummary.worstPage.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{resolvedAudit.crawlSummary.worstPage.url}</div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Pillars */}
        <div>
          <h2 className="font-display text-2xl font-bold mb-5">{t("report.scoreBreakdown")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {breakdown.map((p: ScoreBreakdown, i: number) => {
              const Icon = PILLAR_ICONS[p.pillar] ?? Zap;
              const color = PILLAR_COLORS[p.pillar] ?? "#FF6600";
              return (
                <motion.div key={p.pillar} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border/60 bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="size-10 rounded-xl grid place-items-center" style={{ background: `${color}1a`, color }}><Icon className="size-5" /></span>
                    <span className="font-display text-2xl font-extrabold tabular-nums" style={{ color }}>{p.score}</span>
                  </div>
                  <div className="font-semibold text-sm">{p.label}</div>
                  <div className="mt-2.5"><ScoreBar score={p.score} label="" /></div>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{p.summary}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Customer Eye Test — from audits.eye_test_result (mapped → customerEyeTest) */}
        {resolvedAudit.customerEyeTest && (
          <div id="guided-customer-eye">
            <CustomerEyeTestCard
              eye={resolvedAudit.customerEyeTest}
              auditId={auditId}
              productUrl={resolvedAudit.productUrl}
              overallScore={resolvedAudit.overallScore}
              breakdown={breakdown}
              recommendations={recommendations}
            />
          </div>
        )}

        {/* Priority Fixes (critical/high subset — same IssueCard) */}
        {priorityFixes.length > 0 && (
          <div id="guided-priority-fixes">
            <h2 className="font-display text-2xl font-bold mb-5">{t("guided.priorityFixes")}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {priorityFixes.map((r: Recommendation, i: number) => (
                <IssueCard key={`priority-${r.id}`} issue={r} userPlan={userPlan} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Comparison + GEO */}
        <div className="grid lg:grid-cols-2 gap-6">
          {hasCompetitor && (
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="font-display text-lg font-bold flex items-center gap-2"><TrendingUp className="size-5 text-primary" /> {t("report.competitorComparison")}</h2>
              <div className="mt-5 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="pillar" tick={{ fill: "oklch(0.55 0.01 250)", fontSize: 12, fontWeight: 600 }} width={70} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="competitor" radius={[0, 6, 6, 0]} fill="oklch(0.63 0 0 / 0.35)" barSize={14} />
                    <Bar dataKey="you" radius={[0, 6, 6, 0]} fill="#FF6600" barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-5 text-xs mt-2">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> {t("report.you")}</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-muted-foreground/40" /> {t("report.competitor")}</span>
              </div>
            </div>
          )}

          <div className={cn("rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/5 to-transparent p-6", !hasCompetitor && "lg:col-span-2")}>
            <div className="flex items-center gap-2 mb-1"><Bot className="size-5 text-brand" /><h2 className="font-display text-lg font-bold">{t("report.geoTitle")}</h2></div>
            <p className="text-sm text-muted-foreground">{t("report.geoSub")}</p>
            <div className="mt-5 grid grid-cols-3 gap-4">
              {[
                { n: "ChatGPT", s: resolvedAudit.geoReadability?.chatgpt ?? 0 },
                { n: "Perplexity", s: resolvedAudit.geoReadability?.perplexity ?? 0 },
                { n: "Google AI", s: resolvedAudit.geoReadability?.googleAI ?? 0 },
              ].map((g) => (
                <div key={g.n} className="text-center rounded-xl border border-border/50 bg-background/40 p-4">
                  <ScoreRadial score={g.s} size={88} stroke={7} gold />
                  <div className="text-xs font-semibold mt-2">{g.n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div id="guided-recommendations">
          <h2 className="font-display text-2xl font-bold mb-5">{t("report.aiRecommendations")}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.map((r: Recommendation, i: number) => (
              <IssueCard key={r.id} issue={r} userPlan={userPlan} index={i} />
            ))}
          </div>
          {userPlan === "free" && recommendations.length >= 8 && (
            <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center">
              <Crown className="size-8 text-brand mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold">{t("report.moreOnPro", { count: "all" })}</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Unlock 1-click Quick Fixes, unlimited recommendations, and the Content Improver on Pro.
              </p>
              <Button asChild className="mt-4 rounded-full shadow-glow"><Link href="/pricing"><Crown className="size-4 ml-1" /> {t("report.upgradePro")}</Link></Button>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="rounded-2xl gradient-brand p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-20" />
          <div className="relative">
            <h3 className="font-display text-2xl font-bold">{t("report.applyFixes")}</h3>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button asChild variant="secondary" className="rounded-full font-semibold"><Link href={`/audit/${auditId}/generate`}>{t("report.aiGenerator")}</Link></Button>
              {hasCompetitor && (
                <Button asChild variant="outline" className="rounded-full font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20"><Link href={`/audit/${auditId}/compare`}>{t("compare.title")} <ArrowRight className="size-4 ml-1" /></Link></Button>
              )}
            </div>
          </div>
        </div>
      </PageContent>
      {guided && (
        <GuidedFlowRail
          auditId={auditId}
          step={flowStep}
          onStepChange={setFlowStep}
        />
      )}
    </PageShell>
  );
}

