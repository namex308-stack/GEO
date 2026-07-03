"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Store, Globe2, ArrowLeft, Check } from "lucide-react";
import { PageShell, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";

export default function OnboardingStorePage() {
  const t = useT();
  const [storeUrl, setStoreUrl] = React.useState("");
  const [competitorUrl, setCompetitorUrl] = React.useState("");
  const valid = storeUrl.length > 3 && (storeUrl.startsWith("http") || storeUrl.includes("."));

  return (
    <PageShell>
      <PageContent className="max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`size-8 rounded-full grid place-items-center text-xs font-bold border-2 ${i <= 1 ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{i < 1 ? <Check className="size-3.5" /> : s}</div>
              {s < 4 && <div className="w-8 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>

        <Link href="/onboarding/platform" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="size-4" /> {t("onboarding.back")}
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
            <Store className="size-6" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">{t("onboarding.store.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("onboarding.store.subtitle")}</p>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Globe2 className="size-4" /> {t("onboarding.store.url")} <span className="text-rose-500">*</span>
              </Label>
              <Input type="url" placeholder={t("onboarding.store.urlPlaceholder")} value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} className="h-12 rounded-xl text-sm" autoFocus />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Store className="size-4" /> {t("onboarding.store.competitor")} ({t("onboarding.store.optional")})
              </Label>
              <Input type="url" placeholder={t("onboarding.store.competitorPlaceholder")} value={competitorUrl} onChange={(e) => setCompetitorUrl(e.target.value)} className="h-12 rounded-xl text-sm" />
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-primary/5 border border-primary/20 p-3.5 flex gap-2.5">
            <Check className="size-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{t("onboarding.store.tip")}</p>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Link href="/onboarding/platform"><Button variant="ghost" className="rounded-full">{t("onboarding.back")}</Button></Link>
            <Button asChild disabled={!valid} className="rounded-full font-semibold px-7 shadow-glow disabled:opacity-40">
              <Link href="/onboarding/goals">{t("onboarding.continue")}</Link>
            </Button>
          </div>
        </motion.div>
      </PageContent>
    </PageShell>
  );
}
