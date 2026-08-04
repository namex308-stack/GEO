"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, ArrowUpRight, ArrowRight, Loader2, Search } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale/resolve";

type HistoryItem = {
  id: string;
  productName: string;
  storeName: string;
  productUrl: string;
  overallScore: number | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

function HistoryContent() {
  const t = useT();
  const { dir } = useLocale();
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() || "";
  const [audits, setAudits] = React.useState<HistoryItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState(q);

  React.useEffect(() => {
    setQuery(q);
  }, [q]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const url = q ? `/api/audits?q=${encodeURIComponent(q)}` : "/api/audits";
        const res = await fetch(url);
        if (!res.ok) {
          if (!cancelled) {
            setError(
              res.status === 401 ? t("history.signInRequired") : t("history.loadError")
            );
          }
          return;
        }
        const data = (await res.json()) as { audits: HistoryItem[] };
        if (!cancelled) setAudits(data.audits ?? []);
      } catch {
        if (!cancelled) setError(t("history.loadError"));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [q, t]);

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
              <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("dashboard.searchPlaceholder")}
                className="h-9 w-44 sm:w-56 rounded-full border border-border/60 bg-card ps-8 pe-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
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
        {audits === null && !error && (
          <div className="py-16 text-center" aria-busy="true">
            <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/auth">{t("history.signIn")}</Link>
            </Button>
          </div>
        )}

        {audits && audits.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {q ? t("history.noResults") : t("history.empty")}
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link href="/audit/new">
                {t("dashboard.runFirstAudit")}{" "}
                <ArrowRight className={`size-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Link>
            </Button>
          </div>
        )}

        {audits && audits.length > 0 && (
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/50">
            {audits.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={`/audit/${r.id}/report`}
                  className="w-full flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4 hover:bg-accent/40 transition-colors text-start"
                >
                  <ScoreRadial
                    score={r.overallScore ?? 0}
                    size={44}
                    stroke={4.5}
                    animate={false}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-start">
                    <div className="text-sm font-semibold truncate">{r.productName}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5" dir="ltr">
                      {r.storeName} · {r.productUrl}
                    </div>
                  </div>
                  <ArrowUpRight
                    className={`size-4 text-muted-foreground shrink-0 ${dir === "rtl" ? "-scale-x-100" : ""}`}
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </PageContent>
    </>
  );
}

export default function HistoryPage() {
  return (
    <PageShell>
      <React.Suspense
        fallback={
          <div className="py-16 text-center" aria-busy="true">
            <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          </div>
        }
      >
        <HistoryContent />
      </React.Suspense>
    </PageShell>
  );
}
