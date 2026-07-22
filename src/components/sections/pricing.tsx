"use client";



import { ShieldCheck, Zap } from "lucide-react";

import { PricingSection } from "@/components/PricingSection";
import { useSession } from "@/components/auth/session-provider";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useT } from "@/lib/i18n";

export function Pricing() {
  const { user } = useSession();
  const { startAuditAndNavigate, openLoginAndNavigate } = useNavigateAfterAction();
  const t = useT();

  const handleFreeCta = () => {
    if (user) startAuditAndNavigate();
    else openLoginAndNavigate();
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

          <PricingSection onFreeCta={handleFreeCta} />

        </div>

      </div>

    </section>

  );

}

