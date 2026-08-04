"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Crown,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AuthShell } from "@/components/app/page-shell";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { formatEgp, getCheckoutPrice } from "@/lib/billing/plans";
import {
  assertNoUpgradeLoop,
  buildPostPaymentPath,
} from "@/lib/billing/upgrade-flow";
import {
  KASHIER_PAYMENT_METHODS,
  type KashierPaymentMethodId,
} from "@/lib/kashier/payment-methods";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const VALID_PLANS = ["pro", "business"] as const;
const VALID_PERIODS = ["monthly", "yearly"] as const;

export default function CheckoutPage() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  const planParam = searchParams.get("plan") ?? "pro";
  const periodParam = searchParams.get("period") ?? "monthly";
  const planId = VALID_PLANS.includes(planParam as (typeof VALID_PLANS)[number])
    ? (planParam as (typeof VALID_PLANS)[number])
    : "pro";
  const period = VALID_PERIODS.includes(periodParam as (typeof VALID_PERIODS)[number])
    ? (periodParam as (typeof VALID_PERIODS)[number])
    : "monthly";

  const [selected, setSelected] = React.useState<KashierPaymentMethodId | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const amount = getCheckoutPrice(planId, period);
  const planLabel = planId === "business" ? t("plan.business.name") : t("plan.pro.name");

  React.useEffect(() => {
    if (searchParams.get("error") === "payment_failed") {
      toast.error(t("checkout.paymentFailed"));
    }
  }, [searchParams, t]);

  const payWithMethod = async (methodId: KashierPaymentMethodId) => {
    setSelected(methodId);
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, period, paymentMethod: methodId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? t("checkout.paymentFailed"));
        setSubmitting(false);
        return;
      }

      if (data.url) {
        assertNoUpgradeLoop(data.url);
        window.location.assign(data.url);
        return;
      }

      const fallback = buildPostPaymentPath(planId);
      assertNoUpgradeLoop(fallback);
      toast.success(t("pricing.checkoutDemo"));
      router.push(fallback);
    } catch {
      toast.error(t("checkout.paymentFailed"));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary/10 blur-[140px] rounded-full -z-10" />

        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between gap-4 mb-8">
            <Logo className="h-8" />
            <Button variant="ghost" size="sm" className="rounded-full" asChild>
              <Link href="/pricing">
                <ArrowLeft className="size-4 me-1 rtl:rotate-180" />
                {t("checkout.backToPricing")}
              </Link>
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-6 sm:p-8 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-border/60">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <Sparkles className="size-3.5 text-primary" />
                  {t("checkout.secureTitle")}
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {t("checkout.title")}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                  {t("checkout.subtitle")}
                </p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 min-w-[180px]">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="size-4 text-primary" />
                  <span className="font-display font-bold">{planLabel}</span>
                  <Badge variant="outline" className="rounded-full text-[10px]">
                    {period === "yearly" ? t("landingPricing.yearly") : t("landingPricing.monthly")}
                  </Badge>
                </div>
                <div className="font-display text-2xl font-extrabold">
                  {formatEgp(amount)} <span className="text-sm font-medium text-muted-foreground">EGP</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <h2 className="font-display text-lg font-bold mb-1">{t("checkout.chooseMethod")}</h2>
              <p className="text-sm text-muted-foreground mb-5">{t("checkout.chooseMethodDesc")}</p>

              <div className="grid sm:grid-cols-2 gap-3">
                {KASHIER_PAYMENT_METHODS.map((method, index) => {
                  const Icon = method.icon;
                  const isActive = selected === method.id;
                  const isLoading = submitting && isActive;

                  return (
                    <motion.button
                      key={method.id}
                      type="button"
                      disabled={submitting}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      onClick={() => void payWithMethod(method.id)}
                      className={cn(
                        "group relative flex items-center gap-4 rounded-2xl border p-4 text-start transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        method.surfaceClass,
                        isActive && "ring-2 ring-white/80 ring-offset-2 ring-offset-background scale-[1.01]",
                        submitting && !isActive && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "size-12 rounded-xl grid place-items-center shrink-0 transition-transform group-hover:scale-105",
                          method.iconClass
                        )}
                      >
                        {isLoading ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : (
                          <Icon className="size-5" />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base">{t(method.labelKey)}</div>
                        <div className="text-xs opacity-90 mt-0.5">{t(method.descKey)}</div>
                      </div>
                      <span
                        className={cn(
                          "size-6 rounded-full border-2 grid place-items-center shrink-0 transition-all",
                          isActive ? "border-white bg-white text-slate-900" : "border-white/40 opacity-70"
                        )}
                      >
                        {isActive && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border/60 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary shrink-0" />
                <span>{t("pricing.secureCheckout")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="size-3.5 shrink-0" />
                <span>{t("checkout.pciNote")}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AuthShell>
  );
}
