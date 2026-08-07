"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Swords, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { isPlaceholderAuditId } from "@/lib/audits/types";
import { PILLAR_LABEL_KEYS } from "@/lib/report/recommendation-display";
import type { AuditData } from "@/lib/types";

export default function ComparePage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [audit, setAudit] = React.useState<AuditData | null>(null);
  const [competitorAllowed, setCompetitorAllowed] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [canRetry, setCanRetry] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id || isPlaceholderAuditId(id)) {
        if (!cancelled) {
          setAudit(null);
          setCompetitorAllowed(false);
          setLoadError(null);
          setCanRetry(false);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      setLoadError(null);
      setCanRetry(false);
      try {
        const [res, shellRes] = await Promise.all([
          fetch(`/api/audit/${id}`),
          fetch("/api/shell"),
        ]);
        if (!res.ok) {
          if (!cancelled) {
            setAudit(null);
            setCompetitorAllowed(false);
            if (res.status === 404) {
              setLoadError(t("compare.notFound"));
              setCanRetry(false);
            } else {
              setLoadError(t("history.loadError"));
              setCanRetry(true);
            }
          }
          return;
        }
        const data = (await res.json()) as { audit: AuditData };
        let allowed = false;
        if (shellRes.ok) {
          const shellJson = (await shellRes.json()) as {
            shell?: { features?: { competitor?: boolean } };
          };
          allowed = Boolean(shellJson.shell?.features?.competitor);
        }
        if (!cancelled) {
          setAudit(data.audit);
          setCompetitorAllowed(allowed);
        }
      } catch {
        if (!cancelled) {
          setAudit(null);
          setCompetitorAllowed(false);
          setLoadError(t("history.loadError"));
          setCanRetry(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, retryKey, t]);

  if (loading) {
    return (
      <PageShell>
        <PageContent className="max-w-md py-20 text-center">
          <Loader2 className="size-8 animate-spin mx-auto text-primary" />
        </PageContent>
      </PageShell>
    );
  }

  if (!audit) {
    return (
      <PageShell>
        <PageHeader title={t("compare.title")} icon={Swords} back="/history" />
        <PageContent className="max-w-lg py-12">
          <ApiLoadError
            message={loadError ?? t("compare.notFound")}
            onRetry={canRetry ? () => setRetryKey((k) => k + 1) : undefined}
          />
          <div className="mt-4 text-center">
            <Button asChild className="rounded-full">
              <Link href="/audit/new">{t("compare.newAudit")}</Link>
            </Button>
          </div>
        </PageContent>
      </PageShell>
    );
  }

  const hasCompetitor = Boolean(audit.competitorBreakdown?.length);

  return (
    <PageShell>
      <PageHeader
        title={t("compare.title")}
        subtitle={audit.productName}
        icon={Swords}
        back={`/audit/${id}/report`}
      />
      <PageContent className="space-y-6 max-w-3xl">
        {!competitorAllowed ? (
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t("dashboard.unlockSub")}
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/pricing">{t("nav.upgradePlan")}</Link>
            </Button>
          </div>
        ) : !hasCompetitor ? (
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t("compare.noCompetitorHint")}
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/audit/new">{t("compare.newAudit")}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {audit.competitorBreakdown!.map((c, i) => {
              const you = audit.breakdown.find((b) => b.pillar === c.pillar)?.score ?? 0;
              const delta = you - c.score;
              return (
                <motion.div
                  key={c.pillar}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-border/60 bg-card p-5 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{t(PILLAR_LABEL_KEYS[c.pillar])}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("compare.youVsCompetitor", { you, competitor: c.score })}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`rounded-full tabular-nums ${
                      delta >= 0 ? "text-primary border-primary/30" : "text-rose-500 border-rose-500/30"
                    }`}
                  >
                    <TrendingUp className="size-3 me-1" />
                    {delta >= 0 ? `+${delta}` : delta}
                  </Badge>
                </motion.div>
              );
            })}
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/audit/${id}/report`}>
                <ArrowRight className="size-4 me-1 rotate-180 rtl:rotate-0" /> {t("compare.backToReport")}
              </Link>
            </Button>
          </div>
        )}
      </PageContent>
    </PageShell>
  );
}
