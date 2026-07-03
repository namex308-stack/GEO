"use client";

import { Check, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";

type Plan = {
  id: string;
  nameKey: TranslationKey;
  price: string;
  periodKey: TranslationKey;
  taglineKey: TranslationKey;
  auditsKey: TranslationKey;
  featureKeys: readonly TranslationKey[];
  ctaKey: TranslationKey;
  href: string;
  highlight?: boolean;
};

const PLANS: readonly Plan[] = [
  {
    id: "free",
    nameKey: "pricing.free",
    price: "$0",
    periodKey: "pricing.forever",
    taglineKey: "pricing.freeTagline",
    auditsKey: "pricing.3Audits",
    featureKeys: [
      "pricing.free.f1",
      "pricing.free.f2",
      "pricing.free.f3",
      "pricing.free.f4",
      "pricing.free.f5",
    ],
    ctaKey: "pricing.startFree",
    href: "/auth",
  },
  {
    id: "pro",
    nameKey: "pricing.pro",
    price: "$29",
    periodKey: "pricing.perMonth",
    taglineKey: "pricing.proTagline",
    auditsKey: "pricing.unlimitedAudits",
    featureKeys: [
      "pricing.pro.f1",
      "pricing.pro.f2",
      "pricing.pro.f3",
      "pricing.pro.f4",
      "pricing.pro.f5",
      "pricing.pro.f6",
    ],
    highlight: true,
    ctaKey: "pricing.goPro",
    href: "/auth",
  },
  {
    id: "business",
    nameKey: "pricing.business",
    price: "$79",
    periodKey: "pricing.perMonth",
    taglineKey: "pricing.businessTagline",
    auditsKey: "pricing.everythingPro",
    featureKeys: [
      "pricing.business.f1",
      "pricing.business.f2",
      "pricing.business.f3",
      "pricing.business.f4",
      "pricing.business.f5",
      "pricing.business.f6",
    ],
    ctaKey: "pricing.startBusiness",
    href: "/auth",
  },
];

export default function PricingPage() {
  const t = useT();
  return (
    <PageShell>
      <PageHeader title={t("pricing.title")} subtitle={t("pricing.subtitle")} icon={Zap} />
      <PageContent>
        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-2xl border bg-card p-6 flex flex-col",
                plan.highlight ? "border-primary/50 shadow-glow lg:scale-[1.03]" : "border-border/60"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2">
                  <Badge className="rounded-full px-3 py-1 gap-1 gradient-brand text-white border-0">
                    <Sparkles className="size-3" /> {t("pricing.mostPopular")}
                  </Badge>
                </div>
              )}
              <h3 className="font-display text-xl font-bold">{t(plan.nameKey)}</h3>
              <p className="mt-1 text-sm text-muted-foreground min-h-[40px]">{t(plan.taglineKey)}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-display text-4xl font-extrabold tabular-nums">{plan.price}</span>
                <span className="text-sm text-muted-foreground mb-1.5">{t(plan.periodKey)}</span>
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full w-fit">
                <Zap className="size-3" /> {t(plan.auditsKey)}
              </div>
              <Button asChild className={cn("mt-6 rounded-full font-semibold h-11", plan.highlight && "shadow-glow")} variant={plan.highlight ? "default" : "outline"}>
                <a href={plan.href}>{t(plan.ctaKey)}</a>
              </Button>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.featureKeys.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 size-4 rounded-full bg-primary/15 grid place-items-center shrink-0">
                      <Check className="size-3 text-primary" />
                    </span>
                    <span className="text-foreground/80">{t(f)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> {t("pricing.securePaddle")}</span>
          <span>·</span><span>Visa · Mastercard · Apple Pay · PayPal</span>
          <span>·</span><span>{t("pricing.billedUSD")}</span>
          <span>·</span><span>{t("pricing.cancelAnytime")}</span>
        </div>
      </PageContent>
    </PageShell>
  );
}
