"use client";

import { motion } from "framer-motion";
import { Gift, Users, DollarSign, TrendingUp, Copy, Check, ArrowRight } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useT, type TranslationKey } from "@/lib/i18n";

type Perk = {
  icon: typeof DollarSign;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  color: string;
};

const PERKS: readonly Perk[] = [
  { icon: DollarSign, titleKey: "affiliate.30Recurring", descKey: "affiliate.30RecurringDesc", color: "#FF6600" },
  { icon: Users, titleKey: "affiliate.90Days", descKey: "affiliate.90DaysDesc", color: "#ff983f" },
  { icon: TrendingUp, titleKey: "affiliate.realTime", descKey: "affiliate.realTimeDesc", color: "#cc5200" },
  { icon: Gift, titleKey: "affiliate.perks", descKey: "affiliate.perksDesc", color: "#929292" },
];

type Tier = {
  nameKey: TranslationKey;
  customers: string;
  commission: string;
  bonus: string;
};

const TIERS: readonly Tier[] = [
  { nameKey: "affiliate.tierStarter", customers: "1-10", commission: "30%", bonus: "—" },
  { nameKey: "affiliate.tierActive", customers: "11-50", commission: "32%", bonus: "$50" },
  { nameKey: "affiliate.tierPro", customers: "51-100", commission: "35%", bonus: "$200" },
  { nameKey: "affiliate.tierElite", customers: "+100", commission: "40%", bonus: "$500" },
];

type Stat = {
  labelKey: TranslationKey;
  value: string;
  color: string;
};

export default function AffiliatePage() {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const refLink = "https://storeaudit.ai/?ref=youssef";

  const copy = () => { navigator.clipboard?.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const STATS: readonly Stat[] = [
    { labelKey: "affiliate.activeCustomers", value: "0", color: "#FF6600" },
    { labelKey: "affiliate.clicksMonth", value: "0", color: "#ff983f" },
    { labelKey: "affiliate.pendingEarnings", value: "$0", color: "#cc5200" },
    { labelKey: "affiliate.totalPaid", value: "$0", color: "#929292" },
  ];

  return (
    <PageShell>
      <PageHeader title={t("affiliate.title")} subtitle={t("affiliate.subtitle")} icon={Gift} />
      <PageContent className="space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-primary/30 gradient-brand p-8 sm:p-10 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-20" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-4">
              <DollarSign className="size-3.5" /> {t("affiliate.recurringCommission")}
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">{t("affiliate.turnRec")}</h2>
            <p className="mt-3 text-white/85 max-w-xl mx-auto text-pretty">
              {t("affiliate.turnRecSub")}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/30 px-4 py-2 backdrop-blur" dir="ltr">
                <code className="text-sm font-mono">{refLink}</code>
                <button onClick={copy} className="size-7 rounded-full bg-white/20 grid place-items-center hover:bg-white/30 transition-colors" aria-label={t("affiliate.copy")}>
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </button>
              </div>
              <Button variant="secondary" className="rounded-full font-semibold">{t("affiliate.signup")}</Button>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{t(s.labelKey)}</div>
            </motion.div>
          ))}
        </div>

        {/* Perks */}
        <div>
          <h2 className="font-display text-2xl font-bold mb-5">{t("affiliate.whyJoin")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {PERKS.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="rounded-2xl border border-border/60 bg-card p-5 flex items-start gap-4">
                <span className="size-11 rounded-xl grid place-items-center shrink-0" style={{ background: `${p.color}1a`, color: p.color }}><p.icon className="size-5" /></span>
                <div><h3 className="font-semibold text-sm">{t(p.titleKey)}</h3><p className="text-xs text-muted-foreground mt-1">{t(p.descKey)}</p></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tiers */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60"><h2 className="font-display text-lg font-bold">{t("affiliate.tiers")}</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
                <th className="text-right px-6 py-3 font-semibold">{t("affiliate.tier")}</th>
                <th className="text-right px-6 py-3 font-semibold">{t("affiliate.customers")}</th>
                <th className="text-right px-6 py-3 font-semibold">{t("affiliate.commission")}</th>
                <th className="text-right px-6 py-3 font-semibold">{t("affiliate.bonus")}</th>
              </tr></thead>
              <tbody>
                {TIERS.map((tier, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="px-6 py-3.5 font-semibold">{t(tier.nameKey)}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">{tier.customers}</td>
                    <td className="px-6 py-3.5"><Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">{tier.commission}</Badge></td>
                    <td className="px-6 py-3.5 text-muted-foreground">{tier.bonus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <Button size="lg" className="rounded-full font-semibold shadow-glow">{t("affiliate.startNow")} <ArrowRight className="size-4 ml-1.5" /></Button>
          <p className="mt-3 text-xs text-muted-foreground">{t("affiliate.noApproval")}</p>
        </div>
      </PageContent>
    </PageShell>
  );
}
