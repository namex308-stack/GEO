"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Swords, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import type { AuditData, ScorePillar } from "@/lib/types";

const PILLAR_KEYS: Record<ScorePillar, "pillar.conversion" | "pillar.seo" | "pillar.geo" | "pillar.trust"> = {
  conversion: "pillar.conversion",
  seo: "pillar.seo",
  geo: "pillar.geo",
  trust: "pillar.trust",
};

export default function ComparePage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const [audit, setAudit] = React.useState<AuditData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id || id === "demo") {
        if (!cancelled) {
          setAudit(null);
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch(`/api/audit/${id}`);
        if (!res.ok) {
          if (!cancelled) setAudit(null);
          return;
        }
        const data = (await res.json()) as { audit: AuditData };
        if (!cancelled) setAudit(data.audit);
      } catch {
        if (!cancelled) setAudit(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
        <PageContent className="max-w-lg text-center py-12">
          <p className="text-sm text-muted-foreground">{t("compare.notFound")}</p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/audit/new">{t("compare.newAudit")}</Link>
          </Button>
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
        {!hasCompetitor ? (
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
                    <div className="font-semibold text-sm">{t(PILLAR_KEYS[c.pillar])}</div>
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
