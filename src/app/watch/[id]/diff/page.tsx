"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { GitCompare, ArrowDown, ArrowUp, Minus, Eye } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

type ChangeType = "improved" | "regressed" | "same" | "changed";

const DIFFS: Array<{
  fieldKey: TranslationKey;
  beforeKey: TranslationKey;
  afterKey: TranslationKey;
  impactKey: TranslationKey;
  change: ChangeType;
}> = [
  { fieldKey: "watch.diff.diff1.field", beforeKey: "watch.diff.diff1.before", afterKey: "watch.diff.diff1.after", impactKey: "watch.diff.diff1.impact", change: "improved" },
  { fieldKey: "watch.diff.diff2.field", beforeKey: "watch.diff.diff2.before", afterKey: "watch.diff.diff2.after", impactKey: "watch.diff.diff2.impact", change: "improved" },
  { fieldKey: "watch.diff.diff3.field", beforeKey: "watch.diff.diff3.before", afterKey: "watch.diff.diff3.after", impactKey: "watch.diff.diff3.impact", change: "regressed" },
  { fieldKey: "watch.diff.diff4.field", beforeKey: "watch.diff.diff4.before", afterKey: "watch.diff.diff4.after", impactKey: "watch.diff.diff4.impact", change: "improved" },
  { fieldKey: "watch.diff.diff5.field", beforeKey: "watch.diff.diff5.before", afterKey: "watch.diff.diff5.after", impactKey: "watch.diff.diff5.impact", change: "same" },
  { fieldKey: "watch.diff.diff6.field", beforeKey: "watch.diff.diff6.before", afterKey: "watch.diff.diff6.after", impactKey: "watch.diff.diff6.impact", change: "changed" },
];

const CHANGE_META: Record<ChangeType, { icon: typeof ArrowUp; color: string; bg: string; labelKey: TranslationKey }> = {
  improved: { icon: ArrowUp, color: "#FF6600", bg: "bg-primary/10", labelKey: "watch.diff.improved" },
  regressed: { icon: ArrowDown, color: "#f43f5e", bg: "bg-rose-500/10", labelKey: "watch.diff.regressed" },
  same: { icon: Minus, color: "#929292", bg: "bg-muted", labelKey: "watch.diff.same" },
  changed: { icon: Eye, color: "#ff983f", bg: "bg-brand/10", labelKey: "watch.diff.changed" },
};

export default function DiffPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useT();

  return (
    <PageShell>
      <PageHeader title={t("watch.diff.title")} subtitle={t("watch.diff.subtitle", { id })} icon={GitCompare} back="/watch/alerts" />
      <PageContent className="space-y-6">
        {/* Score diff */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5 text-center">
            <div className="text-xs text-muted-foreground mb-1">{t("watch.diff.before")}</div>
            <div className="font-display text-3xl font-bold text-muted-foreground">79</div>
          </div>
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center">
            <div className="text-xs text-muted-foreground mb-1">{t("watch.diff.after")}</div>
            <div className="font-display text-3xl font-bold text-primary">82</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5 text-center">
            <div className="text-xs text-muted-foreground mb-1">{t("watch.diff.change")}</div>
            <div className="font-display text-3xl font-bold text-primary">+3</div>
          </div>
        </div>

        {/* Field diffs */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60">
            <h2 className="font-display text-lg font-bold">{t("watch.diff.detected")}</h2>
          </div>
          <div className="divide-y divide-border/50">
            {DIFFS.map((d, i) => {
              const m = CHANGE_META[d.change];
              return (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="px-6 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`size-7 rounded-lg grid place-items-center ${m.bg}`} style={{ color: m.color }}><m.icon className="size-4" /></span>
                    <span className="text-sm font-semibold">{t(d.fieldKey)}</span>
                    <Badge variant="outline" className={`text-[10px] ${m.bg} border-0`} style={{ color: m.color }}>{t(m.labelKey)}</Badge>
                    <span className="text-xs text-muted-foreground mr-auto">{t(d.impactKey)}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mt-2">
                    <div className="rounded-lg bg-muted/30 p-3 border border-border/50">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{t("watch.diff.before")}</div>
                      <p className="text-sm text-muted-foreground line-through opacity-70">{t(d.beforeKey)}</p>
                    </div>
                    <div className="rounded-lg bg-primary/5 p-3 border border-primary/20">
                      <div className="text-[10px] font-bold uppercase text-primary mb-1">{t("watch.diff.after")}</div>
                      <p className="text-sm">{t(d.afterKey)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
