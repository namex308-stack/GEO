"use client";

import { MessageSquareQuote } from "lucide-react";
import { Container, Section, SectionHeader, SurfaceCard } from "@/components/design-system/section";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useT } from "@/lib/i18n";

/**
 * Credibility-safe placeholder. No fabricated testimonials, names, or ratings.
 */
export function Testimonials() {
  const t = useT();
  return (
    <Section tone="bordered" className="py-16 sm:py-20">
      <Container>
        <SectionHeader
          align="center"
          eyebrow={t("testimonials.eyebrow")}
          title={t("testimonials.title")}
          description={t("testimonials.placeholder.subtitle")}
          className="mb-10"
        />
        <BlurFade>
          <SurfaceCard className="max-w-2xl mx-auto items-center text-center p-8 sm:p-10">
            <span className="size-12 rounded-xl bg-muted text-muted-foreground grid place-items-center">
              <MessageSquareQuote className="size-6" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold">
              {t("testimonials.placeholder.title")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
              {t("testimonials.placeholder.body")}
            </p>
          </SurfaceCard>
        </BlurFade>
      </Container>
    </Section>
  );
}
