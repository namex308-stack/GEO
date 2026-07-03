"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { PLANS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

const PLAN_T = {
  free: {
    name: "plan.starter.name",
    tagline: "plan.starter.tagline",
    audits: "plan.starter.audits",
    cta: "plan.starter.cta",
    period: "plan.starter.period",
    features: [
      "plan.starter.f1",
      "plan.starter.f2",
      "plan.starter.f3",
      "plan.starter.f4",
      "plan.starter.f5",
    ],
  },
  pro: {
    name: "plan.pro.name",
    tagline: "plan.pro.tagline",
    audits: "plan.pro.audits",
    cta: "plan.pro.cta",
    period: "plan.pro.period",
    features: [
      "plan.pro.f1",
      "plan.pro.f2",
      "plan.pro.f3",
      "plan.pro.f4",
      "plan.pro.f5",
      "plan.pro.f6",
      "plan.pro.f7",
    ],
  },
  business: {
    name: "plan.business.name",
    tagline: "plan.business.tagline",
    audits: "plan.business.audits",
    cta: "plan.business.cta",
    period: "plan.business.period",
    features: [
      "plan.business.f1",
      "plan.business.f2",
      "plan.business.f3",
      "plan.business.f4",
      "plan.business.f5",
      "plan.business.f6",
      "plan.business.f7",
    ],
  },
} as const;

export function Pricing() {
  const { isAuthed } = useAppStore();
  const { startAuditAndNavigate, openLoginAndNavigate } = useNavigateAfterAction();
  const [yearly, setYearly] = React.useState(false);
  const t = useT();

  const handleCta = async (planId: string) => {
    if (planId === "free") {
      if (isAuthed) startAuditAndNavigate();
      else openLoginAndNavigate();
      return;
    }
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, period: yearly ? "yearly" : "monthly" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      toast.success("Checkout ready (demo mode)", {
        description: `${planId === "pro" ? "Pro · $29" : "Business · $79"} ${yearly ? "yearly" : "monthly"} · add Paddle keys to .env.local to go live`,
      });
    } catch {
      toast.error("Checkout failed. Please try again.");
    }
  };

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-muted/20 border-y border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t("landingPricing.eyebrow")}</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance">
            {t("landingPricing.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            {t("landingPricing.subtitle")}
          </p>

          <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-border/60 bg-card p-1">
            <button
              onClick={() => setYearly(false)}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-full transition-colors", !yearly && "bg-primary text-primary-foreground")}
            >
              {t("landingPricing.monthly")}
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn("px-4 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5", yearly && "bg-primary text-primary-foreground")}
            >
              {t("landingPricing.yearly")}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand/20 text-brand">{t("plan.yearlyDiscount")}</span>
            </button>
          </div>
        </div>

        <div className="mt-14 grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => {
            const price = yearly ? Math.round(plan.price * 12 * 0.8) : plan.price;
            const tconf = PLAN_T[plan.id as keyof typeof PLAN_T];
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={cn(
                  "relative rounded-2xl border bg-card p-6 flex flex-col",
                  plan.highlight
                    ? "border-primary/50 shadow-glow lg:scale-[1.03] lg:-mt-2"
                    : "border-border/60"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="rounded-full px-3 py-1 gap-1 gradient-brand text-white border-0">
                      <Sparkles className="size-3" /> {t("plan.mostPopular")}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-bold">{t(tconf.name)}</h3>
                  {plan.id === "business" && <ShieldCheck className="size-4 text-brand" />}
                </div>
                <p className="mt-1 text-sm text-muted-foreground min-h-[40px]">{t(tconf.tagline)}</p>

                <div className="mt-5 flex items-end gap-1">
                  <span className="font-display text-4xl font-extrabold tabular-nums">
                    {plan.priceLabel === "$0" ? "$0" : `$${price}`}
                  </span>
                  <span className="text-sm text-muted-foreground mb-1.5">
                    {plan.id !== "free" && yearly ? "/year" : t(tconf.period)}
                  </span>
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full w-fit">
                  <Zap className="size-3" /> {t(tconf.audits)}
                </div>

                <Button
                  onClick={() => handleCta(plan.id)}
                  className={cn("mt-6 rounded-full font-semibold h-11", plan.highlight && "shadow-glow")}
                  variant={plan.highlight ? "default" : "outline"}
                >
                  {t(tconf.cta)}
                </Button>

                <ul className="mt-6 space-y-3 flex-1">
                  {tconf.features.map((fKey) => (
                    <li key={fKey} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 size-4 rounded-full bg-primary/15 grid place-items-center shrink-0">
                        <Check className="size-3 text-primary" />
                      </span>
                      <span className="text-foreground/80">{t(fKey)}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> {t("landingPricing.securePaddle")}</span>
          <span>·</span>
          <span>{t("landingPricing.cards")}</span>
          <span>·</span>
          <span>{t("landingPricing.billedUSD")}</span>
          <span>·</span>
          <span>{t("landingPricing.cancelAnytime")}</span>
        </div>
      </div>
    </section>
  );
}
