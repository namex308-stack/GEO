"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useT } from "@/lib/i18n";

const FAQS = [
  {
    qKey: "faq.q1",
    aKey: "faq.a1",
  },
  {
    qKey: "faq.q2",
    aKey: "faq.a2",
  },
  {
    qKey: "faq.q3",
    aKey: "faq.a3",
  },
  {
    qKey: "faq.q4",
    aKey: "faq.a4",
  },
  {
    qKey: "faq.q5",
    aKey: "faq.a5",
  },
  {
    qKey: "faq.q6",
    aKey: "faq.a6",
  },
  {
    qKey: "faq.q7",
    aKey: "faq.a7",
  },
] as const;

export function FAQ() {
  const { startAuditAndNavigate } = useNavigateAfterAction();
  const t = useT();
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance">
            {t("faq.title")}
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-12 space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-xl border border-border/60 bg-card px-5 data-[state=open]:shadow-md transition-shadow"
            >
              <AccordionTrigger className="text-left font-display font-semibold text-base hover:no-underline py-5">
                {t(f.qKey)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {t(f.aKey)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground mb-4">{t("faq.stillQuestions")}</p>
          <Button size="lg" onClick={startAuditAndNavigate} className="rounded-full font-semibold h-12 px-8 shadow-glow group">
            {t("faq.cta")}
            <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}
