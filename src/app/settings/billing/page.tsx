"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, Crown, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";

type UsageData = {
  plan: {
    planId: string;
    displayName: string;
    auditsPerMonth: number | null;
    storesLimit: number | null;
  };
  periodEnd: string;
  counts: { audit: number };
  billingEvents: {
    id: string;
    eventType: string;
    provider: string;
    createdAt: string;
    externalId: string | null;
  }[];
  storeCount: number;
};

export default function BillingPage() {
  const t = useT();
  const [usage, setUsage] = React.useState<UsageData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/usage");
        if (!res.ok) {
          if (!cancelled) setError(t("billing.loadError"));
          return;
        }
        const json = (await res.json()) as { usage: UsageData };
        if (!cancelled) setUsage(json.usage);
      } catch {
        if (!cancelled) setError(t("billing.loadError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const auditsUsed = usage?.counts.audit ?? 0;
  const auditsLimit = usage?.plan.auditsPerMonth;
  const remaining =
    auditsLimit != null ? Math.max(0, auditsLimit - auditsUsed) : null;
  const periodEnd = usage
    ? new Date(usage.periodEnd).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <PageShell>
      <PageHeader title={t("billing.title")} subtitle={t("billing.subtitle")} icon={CreditCard} back="/settings" />
      <PageContent className="space-y-6 max-w-3xl">
        {!usage && !error && (
          <div className="py-16 text-center">
            <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {usage && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display text-xl font-bold">{usage.plan.displayName}</h2>
                    <Badge className="rounded-full gradient-brand text-white">
                      {usage.plan.planId}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("billing.planLimits", {
                      audits:
                        usage.plan.auditsPerMonth == null
                          ? "∞"
                          : String(usage.plan.auditsPerMonth),
                      stores:
                        usage.plan.storesLimit == null
                          ? "∞"
                          : String(usage.plan.storesLimit),
                    })}
                  </p>
                </div>
                {usage.plan.planId === "free" && (
                  <Button asChild className="rounded-full shadow-glow">
                    <Link href="/pricing">
                      <Crown className="size-4 me-1 text-brand" /> {t("dashboard.upgrade")}
                    </Link>
                  </Button>
                )}
              </div>
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">{t("billing.auditsRemaining")}</div>
                  <div className="font-display text-xl font-bold mt-1 tabular-nums">
                    {remaining != null && auditsLimit != null
                      ? `${remaining} / ${auditsLimit}`
                      : `${auditsUsed} / ∞`}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("billing.renewsOn")}</div>
                  <div className="font-display text-xl font-bold mt-1 text-base sm:text-xl">
                    {periodEnd}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{t("billing.usedThisPeriod")}</div>
                  <div className="font-display text-xl font-bold mt-1 tabular-nums">{auditsUsed}</div>
                </div>
              </div>
            </motion.div>

            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="font-display text-lg font-bold mb-4">{t("billing.paymentMethod")}</h2>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/20">
                <span className="size-10 rounded-lg bg-background grid place-items-center text-muted-foreground">
                  <CreditCard className="size-5" />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{t("billing.noPayment")}</div>
                  <div className="text-xs text-muted-foreground">{t("billing.noPaymentDesc")}</div>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/pricing">{t("billing.addCard")}</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border/60">
                <h2 className="font-display text-lg font-bold">{t("billing.invoices")}</h2>
              </div>
              {usage.billingEvents.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  {t("billing.noEvents")}
                </div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {usage.billingEvents.map((ev) => (
                    <li key={ev.id} className="px-6 py-3.5 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{ev.eventType}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {ev.provider}
                          {ev.externalId ? ` · ${ev.externalId}` : ""}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(ev.createdAt).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="font-display text-lg font-bold mb-2">{t("dashboard.storesLimit")}</h2>
              <p className="text-sm text-muted-foreground">
                {usage.storeCount}
                {usage.plan.storesLimit != null ? ` / ${usage.plan.storesLimit}` : ""}
              </p>
            </div>
          </>
        )}
      </PageContent>
    </PageShell>
  );
}
