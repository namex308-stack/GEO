"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Bell, ArrowUpRight, Clock, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRadial } from "@/components/common/score-viz";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

const WATCHING = [
  { id: "1", name: "سيروم الأركان للوجه", url: "shop.example.com/products/argan-glow", score: 82, prevScore: 79, alerts: 2, lastCheckKey: "watch.time.hour" as TranslationKey },
  { id: "2", name: "تونر ماء الورد", url: "shop.example.com/products/rose-toner", score: 76, prevScore: 76, alerts: 0, lastCheckKey: "watch.time.3hours" as TranslationKey },
  { id: "3", name: "زيت الحبة السوداء", url: "shop.example.com/products/black-seed", score: 71, prevScore: 73, alerts: 1, lastCheckKey: "watch.time.5hours" as TranslationKey },
];

export default function WatchPage() {
  const t = useT();

  const stats = [
    { icon: Eye, label: t("watch.pagesWatched"), value: "3", color: "#FF6600" },
    { icon: Bell, label: t("watch.activeAlerts"), value: "3", color: "#cc5200" },
    { icon: Clock, label: t("watch.lastCheck"), value: t("watch.ago", { time: t("watch.time.hour") }), color: "#929292" },
  ];

  return (
    <PageShell>
      <PageHeader
        title={t("watch.title")}
        subtitle={t("watch.subtitle")}
        icon={Eye}
        back="/dashboard"
        actions={<Button asChild className="rounded-full shadow-glow"><Link href="/audit/new"><Plus className="size-4 ml-1" /> {t("watch.addWatch")}</Link></Button>}
      />
      <PageContent className="space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border/60 bg-card p-5 flex items-center gap-4">
              <span className="size-11 rounded-xl grid place-items-center" style={{ background: `${s.color}1a`, color: s.color }}><s.icon className="size-5" /></span>
              <div><div className="font-display text-xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
            </motion.div>
          ))}
        </div>

        {/* Watch list */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <h2 className="font-display text-lg font-bold">{t("watch.pagesWatched")}</h2>
            <Button variant="ghost" size="sm" className="rounded-full text-xs" asChild><Link href="/watch/alerts">{t("watch.viewAlerts")}</Link></Button>
          </div>
          <div className="divide-y divide-border/50">
            {WATCHING.map((w, i) => {
              const delta = w.score - w.prevScore;
              return (
                <motion.div key={w.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/watch/${w.id}/diff`} className="flex items-center gap-4 px-6 py-4 hover:bg-accent/40 transition-colors text-right">
                    <ScoreRadial score={w.score} size={48} stroke={5} animate={false} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{w.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{w.url}</div>
                    </div>
                    {w.alerts > 0 && <Badge className="rounded-full bg-brand/15 text-brand border-0">{t("watch.alertsCount", { count: w.alerts })}</Badge>}
                    <div className="hidden sm:flex items-center gap-1 text-xs">
                      {delta > 0 ? <TrendingUp className="size-3.5 text-primary" /> : delta < 0 ? <TrendingDown className="size-3.5 text-rose-500" /> : null}
                      <span className={delta > 0 ? "text-primary font-semibold" : delta < 0 ? "text-rose-500 font-semibold" : "text-muted-foreground"}>{delta > 0 ? `+${delta}` : delta}</span>
                    </div>
                    <span className="text-xs text-muted-foreground hidden md:block">{t("watch.ago", { time: t(w.lastCheckKey) })}</span>
                    <ArrowUpRight className="size-4 text-muted-foreground" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
