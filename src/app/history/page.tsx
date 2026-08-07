"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, ArrowUpRight, ArrowRight, Search } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { AuditRowActions } from "@/components/app/audit-row-actions";
import { HistoryListSkeleton } from "@/components/app/dashboard-skeleton";
import { ApiLoadError } from "@/components/runtime/api-load-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale/resolve";
import { isAuditInProgress, type AuditHistoryItem } from "@/lib/audits/types";

function statusLabel(
  status: string,
  t: ReturnType<typeof useT>
): string | null {
  if (status === "failed") return t("history.statusFailed");
  if (isAuditInProgress(status)) return t("history.statusRunning");
  return null;
}

function HistoryContent() {
  const t = useT();
  const { dir } = useLocale();
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() || "";
  const [audits, setAudits] = React.useState<AuditHistoryItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = React.useState(false);
  const [retryKey, setRetryKey] = React.useState(0);
  const [query, setQuery] = React.useState(q);

  React.useEffect(() => {
    setQuery(q);
  }, [q]);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    setNeedsAuth(false);
    async function load() {
      try {
        const url = q ? `/api/audits?q=${encodeURIComponent(q)}` : "/api/audits";
        const res = await fetch(url);
        if (!res.ok) {
          if (!cancelled) {
            setNeedsAuth(res.status === 401);
            setError(
              res.status === 401 ? t("history.signInRequired") : t("history.loadError")
            );
          }
          return;
        }
        const data = (await res.json()) as { audits: AuditHistoryItem[] };
        if (!cancelled) setAudits(data.audits ?? []);
      } catch {
        if (!cancelled) setError(t("history.loadError"));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [q, t, retryKey]);

  return (
    <>
      <PageHeader
        title={t("history.title")}
        subtitle={t("history.subtitle")}
        icon={Clock}
        back="/dashboard"
        actions={
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const next = query.trim();
              window.location.href = next
                ? `/history?q=${encodeURIComponent(next)}`
                : "/history";
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("dashboard.searchPlaceholder")}
                className="h-10 w-44 sm:w-56 rounded-full border border-border/50 bg-card ps-8 pe-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                aria-label={t("dashboard.searchPlaceholder")}
              />
            </div>
            <Button type="submit" variant="outline" size="sm" className="rounded-full">
              {t("history.filter")}
            </Button>
          </form>
        }
      />
      <PageContent>
        {audits === null && !error && <HistoryListSkeleton />}

        {error && (
          <ApiLoadError
            message={error}
            needsAuth={needsAuth}
            onRetry={() => {
              setAudits(null);
              setRetryKey((k) => k + 1);
            }}
          />
        )}

        {audits && audits.length === 0 && (
          <Card className="p-8 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Clock className="size-5" />
            </span>
            <p className="mt-4 font-display text-base font-bold">
              {q ? t("history.noResults") : t("history.emptyTitle")}
            </p>
            {!q && (
              <p className="mt-1.5 text-sm text-muted-foreground">{t("history.empty")}</p>
            )}
            <Button asChild className="mt-4 rounded-full">
              <Link href="/audit/new">
                {t("dashboard.runFirstAudit")}{" "}
                <ArrowRight className={`size-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Link>
            </Button>
          </Card>
        )}

        {audits && audits.length > 0 && (
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/50">
            {audits.map((r, i) => {
              const label = statusLabel(r.status, t);
              const href = isAuditInProgress(r.status)
                ? `/audit/${r.id}/scanning`
                : r.status === "failed"
                  ? `/audit/${r.id}/scanning`
                  : `/audit/${r.id}/report`;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 hover:bg-accent/40 transition-colors"
                >
                  <Link
                    href={href}
                    className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 py-4 ps-2 text-start"
                  >
                    <ScoreRadial
                      score={r.overallScore ?? 0}
                      size={44}
                      stroke={4.5}
                      animate={false}
                      className="shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-start">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-sm font-semibold truncate">{r.productName}</div>
                        {label && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 rounded-full text-[10px] font-semibold"
                          >
                            {label}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5" dir="ltr">
                        {r.storeName} · {r.productUrl}
                      </div>
                    </div>
                    {r.status !== "failed" && (
                      <ArrowUpRight
                        className={`size-4 text-muted-foreground shrink-0 ${dir === "rtl" ? "-scale-x-100" : ""}`}
                      />
                    )}
                  </Link>
                  <AuditRowActions
                    auditId={r.id}
                    status={r.status}
                    onDeleted={(id) => {
                      setAudits((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));
                    }}
                    className="pe-1"
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </PageContent>
    </>
  );
}

export default function HistoryPage() {
  return (
    <PageShell>
      <React.Suspense fallback={<HistoryListSkeleton />}>
        <HistoryContent />
      </React.Suspense>
    </PageShell>
  );
}
