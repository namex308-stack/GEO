"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ArrowUpRight, Filter, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/empty-state";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { getPlanLimits } from "@/lib/billing/entitlements";
import { resolveEffectivePlan } from "@/lib/billing/dev-unlock";
import { crumbsForPath } from "@/lib/nav-config";
import { formatDistanceToNow } from "date-fns";

interface AuditRow {
  id: string;
  product_name: string | null;
  store_name: string | null;
  overall_score: number | null;
  status: string;
  created_at: string;
  product_url: string;
}

export default function HistoryPage() {
  const t = useT();
  const sb = React.useMemo(() => getSupabaseBrowser(), []);
  const [audits, setAudits] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(!!sb);

  React.useEffect(() => {
    if (!sb) return;

    sb.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (!user) {
          setLoading(false);
          return;
        }

        const profileRes = await sb.from("profiles").select("plan").eq("id", user.id).single();
        const historyLimit = getPlanLimits(
          resolveEffectivePlan((profileRes.data?.plan as "free" | "pro" | "business") ?? "free")
        ).historyLimit;

        let query = sb
          .from("audits")
          .select("id, product_name, store_name, overall_score, status, created_at, product_url")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (historyLimit !== null) {
          query = query.limit(historyLimit);
        } else {
          query = query.limit(50);
        }

        const { data } = await query;
        setAudits(data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sb]);

  return (
    <PageShell>
      <PageHeader title={t("history.title")} subtitle={t("history.subtitle")} icon={Clock} back="/dashboard" crumbs={crumbsForPath("/history")} actions={<Button variant="outline" size="sm" className="rounded-full"><Filter className="size-4 ml-1" /> {t("history.filter")}</Button>} />
      <PageContent>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : audits.length === 0 ? (
          <EmptyState
            title={t("empty.noHistory")}
            ctaLabel={t("empty.noHistory.cta")}
            ctaHref="/audit/new"
          />
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground">
              <span>{t("history.score")}</span><span>{t("history.product")}</span><span>{t("history.date")}</span><span>{t("history.change")}</span><span></span>
            </div>
            <div className="divide-y divide-border/50">
              {audits.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/audit/${a.id}/report`} className="grid sm:grid-cols-[auto_1fr_auto_auto_auto] grid-cols-[auto_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-accent/40 transition-colors text-right">
                    <ScoreRadial score={a.overall_score ?? 0} size={44} stroke={4.5} animate={false} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{a.product_name || extractName(a.product_url)}</div>
                      <div className="text-xs text-muted-foreground">{a.store_name || "—"}</div>
                    </div>
                    <div className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-muted-foreground bg-muted">
                      {a.status === "complete" ? "Done" : a.status}
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </PageContent>
    </PageShell>
  );
}

function extractName(url: string): string {
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean).pop() || "";
    return seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Product";
  } catch {
    return "Product";
  }
}
