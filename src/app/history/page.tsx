"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ArrowUpRight, ArrowRight, Filter } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT, type TranslationKey } from "@/lib/i18n";

const AUDITS: { id: string; name: string; store: string; score: number; dateKey: TranslationKey; dateParams?: Record<string, string | number>; delta: number; statusKey: TranslationKey }[] = [
  { id: "demo", name: "سيروم الأركان للوجه 30مل", store: "ArganBloom", score: 82, dateKey: "history.dateToday", delta: 8, statusKey: "history.complete" },
  { id: "2", name: "تونر ماء الورد 200مل", store: "ArganBloom", score: 76, dateKey: "dashboard.yesterday", delta: 3, statusKey: "history.complete" },
  { id: "3", name: "زيت الحبة السوداء للشعر", store: "ArganBloom", score: 71, dateKey: "dashboard.daysAgo", dateParams: { count: 2 }, delta: -2, statusKey: "history.complete" },
  { id: "4", name: "بخاخ الكركديه للوجه", store: "ArganBloom", score: 88, dateKey: "dashboard.daysAgo", dateParams: { count: 5 }, delta: 12, statusKey: "history.complete" },
  { id: "5", name: "كريم الإضاءة بالزعفران", store: "ArganBloom", score: 69, dateKey: "dashboard.weekAgo", delta: 0, statusKey: "history.complete" },
  { id: "6", name: "شامبو الصبار العضوي", store: "ArganBloom", score: 74, dateKey: "history.weeksAgo", dateParams: { count: 2 }, delta: 5, statusKey: "history.complete" },
];

export default function HistoryPage() {
  const t = useT();

  return (
    <PageShell>
      <PageHeader title={t("history.title")} subtitle={t("history.subtitle")} icon={Clock} back="/dashboard" actions={<Button variant="outline" size="sm" className="rounded-full"><Filter className="size-4 ml-1" /> {t("history.filter")}</Button>} />
      <PageContent>
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground">
            <span>{t("history.score")}</span><span>{t("history.product")}</span><span>{t("history.date")}</span><span>{t("history.change")}</span><span></span>
          </div>
          <div className="divide-y divide-border/50">
            {AUDITS.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/audit/${a.id}/report`} className="grid sm:grid-cols-[auto_1fr_auto_auto_auto] grid-cols-[auto_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-accent/40 transition-colors text-right">
                  <ScoreRadial score={a.score} size={44} stroke={4.5} animate={false} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.store}</div>
                  </div>
                  <div className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">{t(a.dateKey, a.dateParams)}</div>
                  <div className={`hidden sm:flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${a.delta > 0 ? "text-primary bg-primary/10" : a.delta < 0 ? "text-rose-500 bg-rose-500/10" : "text-muted-foreground bg-muted"}`}>
                    {a.delta > 0 ? `+${a.delta}` : a.delta}
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mt-6 text-center">
          <Button asChild variant="outline" className="rounded-full"><Link href="/audit/new"><ArrowRight className="size-4 ml-1 rotate-180" /> {t("report.newAudit")}</Link></Button>
        </div>
      </PageContent>
    </PageShell>
  );
}
