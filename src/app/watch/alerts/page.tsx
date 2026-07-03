"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, AlertTriangle, TrendingDown, Eye, ArrowUpRight } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

type Severity = "critical" | "warning" | "info";

const ALERTS: Array<{
  id: number;
  severity: Severity;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  pageKey: TranslationKey;
  timeKey: TranslationKey;
  useAgo: boolean;
  icon: typeof TrendingDown;
}> = [
  { id: 1, severity: "critical", titleKey: "watch.alerts.alert1.title", descKey: "watch.alerts.alert1.desc", pageKey: "watch.alerts.alert1.page", timeKey: "watch.time.hour", useAgo: true, icon: TrendingDown },
  { id: 2, severity: "warning", titleKey: "watch.alerts.alert2.title", descKey: "watch.alerts.alert2.desc", pageKey: "watch.alerts.alert2.page", timeKey: "watch.time.3hours", useAgo: true, icon: AlertTriangle },
  { id: 3, severity: "critical", titleKey: "watch.alerts.alert3.title", descKey: "watch.alerts.alert3.desc", pageKey: "watch.alerts.alert3.page", timeKey: "watch.time.5hours", useAgo: true, icon: TrendingDown },
  { id: 4, severity: "info", titleKey: "watch.alerts.alert4.title", descKey: "watch.alerts.alert4.desc", pageKey: "watch.alerts.alert4.page", timeKey: "watch.time.yesterday", useAgo: false, icon: Eye },
];

const SEVERITY: Record<Severity, { color: string; bg: string; labelKey: TranslationKey }> = {
  critical: { color: "#f43f5e", bg: "bg-rose-500/10", labelKey: "watch.alerts.critical" },
  warning: { color: "#ff983f", bg: "bg-brand/10", labelKey: "watch.alerts.warning" },
  info: { color: "#929292", bg: "bg-muted", labelKey: "watch.alerts.info" },
};

export default function AlertsPage() {
  const t = useT();

  return (
    <PageShell>
      <PageHeader title={t("watch.alerts.title")} subtitle={t("watch.alerts.subtitle")} icon={Bell} back="/watch" />
      <PageContent className="max-w-3xl space-y-3">
        {ALERTS.map((a, i) => {
          const s = SEVERITY[a.severity];
          const timeText = a.useAgo ? t("watch.ago", { time: t(a.timeKey) }) : t(a.timeKey);
          return (
            <motion.div key={a.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <Link href={`/watch/${a.id}/diff`} className="block rounded-2xl border border-border/60 bg-card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className={`size-10 rounded-xl grid place-items-center shrink-0 ${s.bg}`} style={{ color: s.color }}>
                    <a.icon className="size-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{t(a.titleKey)}</h3>
                      <Badge variant="outline" className={`text-[10px] ${s.bg} border-0`} style={{ color: s.color }}>{t(s.labelKey)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t(a.descKey)}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      <span>{t(a.pageKey)}</span><span>·</span><span>{timeText}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground shrink-0" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </PageContent>
    </PageShell>
  );
}
