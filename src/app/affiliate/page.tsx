"use client";

import { motion } from "framer-motion";
import { Gift, Users, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
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

/**
 * Program overview only — no fabricated affiliate dashboards, referral codes, or earnings.
 */
export default function AffiliatePage() {
  const t = useT();

  return (
    <PageShell>
      <PageHeader title={t("affiliate.title")} subtitle={t("affiliate.subtitle")} icon={Gift} />
      <PageContent className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/30 gradient-brand p-8 sm:p-10 text-center text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-dots opacity-20" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold mb-4">
              <DollarSign className="size-3.5" /> {t("affiliate.recurringCommission")}
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold">{t("affiliate.turnRec")}</h2>
            <p className="mt-3 text-white/85 max-w-xl mx-auto text-pretty">{t("affiliate.turnRecSub")}</p>
            <div className="mt-6 flex justify-center">
              <Button asChild variant="secondary" className="rounded-full font-semibold">
                <Link href="/auth">{t("affiliate.signup")}</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/75">{t("affiliate.comingSoon")}</p>
          </div>
        </motion.div>

        <div>
          <h2 className="font-display text-2xl font-bold mb-5">{t("affiliate.whyJoin")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {PERKS.map((p, i) => (
              <motion.div
                key={p.titleKey}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-border/60 bg-card p-5 flex gap-4"
              >
                <span
                  className="size-10 rounded-xl grid place-items-center shrink-0"
                  style={{ background: `${p.color}1a`, color: p.color }}
                >
                  <p.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{t(p.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t(p.descKey)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="text-center py-6">
          <Button asChild size="lg" className="rounded-full font-semibold shadow-glow">
            <Link href="/auth">
              {t("affiliate.startNow")} <ArrowRight className="size-4 ms-1.5 rtl:rotate-180" />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">{t("affiliate.noApproval")}</p>
        </div>
      </PageContent>
    </PageShell>
  );
}
