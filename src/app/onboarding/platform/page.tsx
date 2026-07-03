"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Boxes, Code2, Sparkles, Check, ArrowLeft } from "lucide-react";
import { PageShell, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const OPTIONS = [
  { value: "shopify", labelKey: "onboarding.platform.shopify" as const, descKey: "onboarding.platform.shopifyDesc" as const, icon: ShoppingBag },
  { value: "woocommerce", labelKey: "onboarding.platform.woo" as const, descKey: "onboarding.platform.wooDesc" as const, icon: Boxes },
  { value: "custom", labelKey: "onboarding.platform.custom" as const, descKey: "onboarding.platform.customDesc" as const, icon: Code2 },
  { value: "other", labelKey: "onboarding.platform.other" as const, descKey: "onboarding.platform.otherDesc" as const, icon: Sparkles },
];

export default function OnboardingPlatformPage() {
  const t = useT();
  const [selected, setSelected] = React.useState<string>("");

  return (
    <PageShell>
      <PageContent className="max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn("size-8 rounded-full grid place-items-center text-xs font-bold border-2", i === 0 ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>{s}</div>
              {s < 4 && <div className="w-8 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>

        <Link href="/auth" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-4" /> {t("onboarding.back")}
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-center">{t("onboarding.platform.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">{t("onboarding.platform.subtitle")}</p>

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
            <Link href="/auth"><Button variant="ghost" className="rounded-full">{t("onboarding.back")}</Button></Link>
            <Button asChild disabled={!selected} className="rounded-full font-semibold px-7 shadow-glow disabled:opacity-40">
              <Link href="/onboarding/store">{t("onboarding.continue")}</Link>
            </Button>
          </div>
        </motion.div>
      </PageContent>
    </PageShell>
  );
}
