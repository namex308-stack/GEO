"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileSearch, Zap, Search, ShieldCheck, Swords, Cpu, Sparkles, Check, Loader2, Globe2 } from "lucide-react";
import { PageShell, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";
import { isAuditInProgress, isPlaceholderAuditId } from "@/lib/audits/types";
import type { AuditData } from "@/lib/types";

type PhaseIcon = typeof FileSearch;

type Phase = {
  icon: PhaseIcon;
  labelKey: TranslationKey;
  detailKey: TranslationKey;
  requiresCompetitor?: boolean;
};

const PHASES: Phase[] = [
  { icon: Globe2, labelKey: "scanning.connecting", detailKey: "scanning.connectingDetail" },
  { icon: FileSearch, labelKey: "scanning.reading", detailKey: "scanning.readingDetail" },
  { icon: Zap, labelKey: "scanning.conversion", detailKey: "scanning.conversionDetail" },
  { icon: ShieldCheck, labelKey: "scanning.trust", detailKey: "scanning.trustDetail" },
  { icon: Search, labelKey: "scanning.seo", detailKey: "scanning.seoDetail" },
  { icon: Swords, labelKey: "scanning.competitor", detailKey: "scanning.competitorDetail", requiresCompetitor: true },
  { icon: Sparkles, labelKey: "scanning.recommendations", detailKey: "scanning.recommendationsDetail" },
  { icon: Cpu, labelKey: "scanning.generating", detailKey: "scanning.generatingDetail" },
];

function phaseIndexForStatus(status: string | undefined, phaseCount: number): number {
  if (!status || isAuditInProgress(status)) {
    if (status === "analyzing") return Math.min(4, phaseCount - 1);
    if (status === "scraping") return Math.min(1, phaseCount - 1);
    return 0;
  }
  if (status === "completed") return Math.max(0, phaseCount - 1);
  return 0;
}

/**
 * Polls Supabase-backed audit status. No sessionStorage — audit id is the source of truth.
 */
export default function ScanningPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const auditId = params?.id ?? "";
  const [phase, setPhase] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [hasCompetitor, setHasCompetitor] = React.useState(false);
  const [openingReport, setOpeningReport] = React.useState(false);

  const visiblePhases = React.useMemo(
    () => PHASES.filter((p) => !p.requiresCompetitor || hasCompetitor),
    [hasCompetitor]
  );

  React.useEffect(() => {
    if (error || openingReport) return;
    const timer = setInterval(() => {
      setPhase((p) => (p >= visiblePhases.length - 1 ? p : p + 1));
    }, 900);
    return () => clearInterval(timer);
  }, [visiblePhases.length, error, openingReport]);

  React.useEffect(() => {
    if (!auditId || isPlaceholderAuditId(auditId)) {
      router.replace("/audit/new");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let redirected = false;

    const goToReport = () => {
      if (cancelled || redirected) return;
      redirected = true;
      setOpeningReport(true);
      setPhase((p) => Math.max(p, visiblePhases.length - 1));
      // Hard navigation avoids soft-nav stalls while the report route compiles.
      window.location.assign(`/audit/${auditId}/report`);
    };

    const poll = async () => {
      try {
        const res = await fetch(`/api/audit/${auditId}`, { cache: "no-store" });
        if (res.status === 404) {
          attempts += 1;
          if (attempts > 40) {
            if (!cancelled) setError(t("scanning.auditNotFound"));
          }
          return;
        }
        if (!res.ok) {
          if (!cancelled) setError(t("scanning.statusError"));
          return;
        }
        const data = (await res.json()) as { audit: AuditData };
        if (cancelled) return;

        setHasCompetitor(Boolean(data.audit.competitorUrl || data.audit.competitorBreakdown?.length));
        const status = data.audit.status;
        setPhase((p) => Math.max(p, phaseIndexForStatus(status, visiblePhases.length)));

        if (status === "failed") {
          setError(t("scanning.failed"));
          return;
        }

        const ready =
          status === "completed" ||
          ((data.audit.breakdown?.length ?? 0) > 0 &&
            data.audit.overallScore != null &&
            !isAuditInProgress(status ?? ""));

        if (ready) {
          goToReport();
        }
      } catch {
        if (!cancelled && !redirected) setError(t("scanning.statusError"));
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), 1200);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [auditId, router, t, visiblePhases.length]);

  return (
    <PageShell>
      <PageContent className="max-w-xl">
        <div className="text-center mb-10">
          <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow mb-5 relative">
            {error ? <FileSearch className="size-8" /> : <Cpu className="size-8" />}
            {!error && !openingReport && (
              <span className="absolute inset-0 rounded-2xl border-2 border-primary/40 animate-pulse-ring" />
            )}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">
            {error
              ? t("scanning.failed")
              : openingReport
                ? t("scanning.openingReport")
                : t("scanning.analyzing")}
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            {error ?? (openingReport ? t("scanning.openingReportHint") : t("scanning.takesTime"))}
          </p>
          {error && (
            <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
              <Button className="rounded-full" onClick={() => router.push("/audit/new")}>
                {t("compare.newAudit")}
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => window.location.reload()}
              >
                {t("scanning.retry")}
              </Button>
            </div>
          )}
        </div>

        {!error && (
          <div className="space-y-2.5">
            {visiblePhases.map((p, i) => {
              const isDone = openingReport || i < phase;
              const isActive = !openingReport && i === phase;
              return (
                <motion.div
                  key={p.labelKey}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3",
                    isDone
                      ? "border-primary/30 bg-primary/5"
                      : isActive
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/50 bg-card"
                  )}
                >
                  <span
                    className={cn(
                      "size-9 rounded-lg grid place-items-center shrink-0",
                      isDone
                        ? "bg-primary/15 text-primary"
                        : isActive
                          ? "gradient-brand text-white"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isDone ? (
                      <Check className="size-4" />
                    ) : isActive ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <p.icon className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 text-start">
                    <div className="text-sm font-semibold">{t(p.labelKey)}</div>
                    <div className="text-xs text-muted-foreground">{t(p.detailKey)}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </PageContent>
    </PageShell>
  );
}
