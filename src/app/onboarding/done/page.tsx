"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, ArrowLeft, Loader2 } from "lucide-react";
import { PageShell, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { useT, type TranslationKey } from "@/lib/i18n";

const STEP_KEYS: TranslationKey[] = [
  "onboarding.done.saveProfile",
  "onboarding.done.configurePlatform",
  "onboarding.done.prioritize",
  "onboarding.done.prepare",
];

export default function OnboardingDonePage() {
  const t = useT();
  const [done, setDone] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => setDone((d) => Math.min(d + 1, STEP_KEYS.length)), 500);
    return () => clearInterval(timer);
  }, []);

  const complete = done >= STEP_KEYS.length;

  return (
    <PageShell>
      <PageContent className="max-w-md text-center">
        {!complete ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="mx-auto size-20 rounded-3xl gradient-brand grid place-items-center text-white shadow-glow mb-6">
              <Loader2 className="size-9 animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-bold">{t("onboarding.done.building")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("onboarding.done.buildingSub")}</p>
            <div className="mt-8 space-y-2.5 text-right">
              {STEP_KEYS.map((s, i) => {
                const isDone = i < done;
                const isActive = i === done;
                return (
                  <div key={i} className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${isDone ? "border-primary/30 bg-primary/5" : isActive ? "border-primary/50 bg-primary/10" : "border-border/50 bg-card"}`}>
                    <span className={`size-7 rounded-lg grid place-items-center shrink-0 ${isDone ? "bg-primary/15 text-primary" : isActive ? "gradient-brand text-white" : "bg-muted text-muted-foreground"}`}>
                      {isDone ? <CheckCircle2 className="size-4" /> : isActive ? <Loader2 className="size-4 animate-spin" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                    </span>
                    <span className="text-sm font-medium">{t(s)}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <div className="mx-auto size-24 rounded-full gradient-brand grid place-items-center text-white shadow-glow-lg mb-6">
              <CheckCircle2 className="size-12" />
            </div>
            <h1 className="font-display text-3xl font-extrabold">{t("onboarding.done.ready")}</h1>
            <p className="mt-3 text-muted-foreground">{t("onboarding.done.readySub")}</p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="size-4" /> {t("onboarding.done.profileReady")}
            </div>
            <div className="mt-8 flex flex-col gap-2">
              <Button asChild className="rounded-full font-semibold h-12 shadow-glow">
                <Link href="/audit/new">{t("onboarding.done.startFirstAudit")}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full h-12">
                <Link href="/dashboard">{t("onboarding.done.exploreDashboard")}</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </PageContent>
    </PageShell>
  );
}
