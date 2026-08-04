"use client";

import { Bot, ShoppingBag, Megaphone } from "lucide-react";
import { Container, Section, SectionHeader, SurfaceCard } from "@/components/design-system/section";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useT } from "@/lib/i18n";

const INSIGHTS = [
  {
    icon: Bot,
    titleKey: "pain.card1.title" as const,
    descKey: "pain.card1.desc" as const,
  },
  {
    icon: ShoppingBag,
    titleKey: "pain.card2.title" as const,
    descKey: "pain.card2.desc" as const,
  },
  {
    icon: Megaphone,
    titleKey: "pain.card3.title" as const,
    descKey: "pain.card3.desc" as const,
  },
] as const;

export function PainPoints() {
  const t = useT();
  return (
    <Section id="pain-points" tone="muted">
      <Container>
        <SectionHeader
          align="center"
          eyebrow={t("pain.eyebrow")}
          title={t("pain.title")}
          description={t("pain.subtitle")}
          className="mb-12"
        />

        <div className="grid md:grid-cols-3 gap-4">
          {INSIGHTS.map((item, i) => (
            <BlurFade key={item.titleKey} delay={i * 0.06} className="h-full">
              <SurfaceCard className="p-6 sm:p-7">
                <span className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-base sm:text-lg font-semibold leading-snug text-balance">
                  {t(item.titleKey)}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                  {t(item.descKey)}
                </p>
              </SurfaceCard>
            </BlurFade>
          ))}
        </div>
      </Container>
    </Section>
  );
}
