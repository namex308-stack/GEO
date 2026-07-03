"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingDown, ShoppingCart, Search, HelpCircle, ArrowLeft, Check } from "lucide-react";
import { PageShell, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const OPTIONS = [
  { value: "traffic_low_sales", labelKey: "onboarding.goals.traffic" as const, descKey: "onboarding.goals.trafficDesc" as const, icon: TrendingDown },
  { value: "abandoned_carts", labelKey: "onboarding.goals.carts" as const, descKey: "onboarding.goals.cartsDesc" as const, icon: ShoppingCart },
  { value: "poor_ranking", labelKey: "onboarding.goals.ranking" as const, descKey: "onboarding.goals.rankingDesc" as const, icon: Search },
  { value: "dont_know", labelKey: "onboarding.goals.dontKnow" as const, descKey: "onboarding.goals.dontKnowDesc" as const, icon: HelpCircle },
];

export default function OnboardingGoalsPage() {
  const t = useT();
  const [selected, setSelected] = React.useState<string>("");

  return (
    <PageShell>
      <PageContent className="max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`size-8 rounded-full grid place-items-center text-xs font-bold border-2 ${i <= 2 ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{i < 2 ? <Check className="size-3.5" /> : s}</div>
              {s < 4 && <div className="w-8 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>

        <Link href="/onboarding/store" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-4" /> {t("onboarding.back")}
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-center">{t("onboarding.goals.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">{t("onboarding.goals.subtitle")}</p>

          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            {OPTIONS.map((opt, i) => (
              <motion.button
                key={opt.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setSelected(opt.value)}
                className={cn(
                  "group flex items-center gap-3.5 rounded-2xl border p-4 text-right transition-all",
                  selected === opt.value ? "border-primary bg-primary/5 shadow-glow" : "border-border/60 hover:border-primary/40 hover:bg-accent/40"
                )}
              >
                <span className={cn("size-11 rounded-xl grid place-items-center shrink-0", selected === opt.value ? "gradient-brand text-white" : "bg-muted text-muted-foreground")}>
                  <opt.icon className="size-5" />
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{t(opt.labelKey)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t(opt.descKey)}</div>
                </div>
                <span className={cn("size-5 rounded-full border-2 grid place-items-center shrink-0", selected === opt.value ? "border-primary bg-primary" : "border-border opacity-0 group-hover:opacity-100")}>
                  {selected === opt.value && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
                </span>
              </motion.button>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Link href="/onboarding/store"><Button variant="ghost" className="rounded-full">{t("onboarding.back")}</Button></Link>
            <Button asChild disabled={!selected} className="rounded-full font-semibold px-7 shadow-glow disabled:opacity-40">
              <Link href="/onboarding/done">{t("onboarding.buildProfile")}</Link>
            </Button>
          </div>
        </motion.div>
      </PageContent>
    </PageShell>
  );
}
