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
import { Container, Section, SectionHeader } from "@/components/design-system/section";

const FAQS = [
  { qKey: "faq.q1" as const, aKey: "faq.a1" as const },
  { qKey: "faq.q2" as const, aKey: "faq.a2" as const },
  { qKey: "faq.q3" as const, aKey: "faq.a3" as const },
  { qKey: "faq.q4" as const, aKey: "faq.a4" as const },
  { qKey: "faq.q5" as const, aKey: "faq.a5" as const },
  { qKey: "faq.q6" as const, aKey: "faq.a6" as const },
  { qKey: "faq.q7" as const, aKey: "faq.a7" as const },
] as const;

export function FAQ() {
  const { startAuditAndNavigate } = useNavigateAfterAction();
  const t = useT();
  return (
    <Section id="faq">
      <Container className="max-w-3xl">
        <SectionHeader
          align="center"
          eyebrow={t("faq.eyebrow")}
          title={t("faq.title")}
          className="mb-10"
        />

        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map((f, i) => (
            <AccordionItem
              key={f.qKey}
              value={`item-${i}`}
              className="rounded-xl border border-border/60 bg-card px-5 shadow-[var(--shadow-card)] data-[state=open]:shadow-[var(--shadow-card-hover)] transition-shadow"
            >
              <AccordionTrigger className="text-start font-display font-semibold text-base hover:no-underline py-5">
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
          <Button size="lg" onClick={startAuditAndNavigate} className="font-semibold h-11 px-7 rounded-full shadow-glow group">
            {t("faq.cta")}
            <ArrowRight className="size-4 ms-0.5 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </Container>
    </Section>
  );
}
