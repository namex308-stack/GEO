"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, ArrowUpRight, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { EmptyState } from "@/components/app/empty-state";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { crumbsForPath } from "@/lib/nav-config";
import { formatDistanceToNow } from "date-fns";

interface AuditRow {
  id: string;
  product_name: string | null;
  store_name: string | null;
  overall_score: number | null;
  created_at: string;
  product_url: string;
}

export default function ReportsPage() {
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
        const { data } = await sb
          .from("audits")
          .select("id, product_name, store_name, overall_score, created_at, product_url")
          .eq("user_id", user.id)
          .eq("status", "complete")
          .order("created_at", { ascending: false })
          .limit(50);
        setAudits(data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sb]);

  return (
    <PageShell>
      <PageHeader
        title={t("reports.title")}
        subtitle={t("reports.subtitle")}
        icon={FileText}
        back="/dashboard"
        crumbs={crumbsForPath("/reports")}
      />
      <PageContent>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : audits.length === 0 ? (
          <EmptyState
            title={t("empty.noReports")}
            ctaLabel={t("empty.noReports.cta")}
            ctaHref="/audit/new"
          />
        ) : (
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/50">
            {audits.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/audit/${a.id}/report`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-accent/40 transition-colors"
                >
                  <ScoreRadial score={a.overall_score ?? 0} size={44} stroke={4.5} animate={false} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {a.product_name || extractName(a.product_url)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })} ·{" "}
                      {a.store_name || "—"}
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Link>
              </motion.div>
            ))}
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
