"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useT, type TranslationKey } from "@/lib/i18n";
import { PRICING_FAQ_KEYS } from "@/lib/billing/plans";

export function PricingFAQ() {
  const t = useT();

  return (
    <section className="py-16 sm:py-20 border-t border-border/40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</span>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            {t("pricingFaq.title")}
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {PRICING_FAQ_KEYS.map((f, i) => (
            <AccordionItem
              key={f.qKey}
              value={`pricing-faq-${i}`}
              className="rounded-xl border border-border/60 bg-card px-5 data-[state=open]:shadow-md transition-shadow"
            >
              <AccordionTrigger className="text-left font-display font-semibold text-base hover:no-underline py-5">
                {t(f.qKey as TranslationKey)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {t(f.aKey as TranslationKey)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
