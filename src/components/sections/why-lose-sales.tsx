"use client";

import { EyeOff, FileWarning, ShieldAlert, Swords } from "lucide-react";
import { StartAuditCta } from "@/components/common/start-audit-cta";
import { Container, Section, SectionHeader, SurfaceCard } from "@/components/design-system/section";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useT } from "@/lib/i18n";

const PROBLEMS = [
  {
    icon: EyeOff,
    titleKey: "whyLose.card1.title" as const,
    descKey: "whyLose.card1.desc" as const,
    color: "#FF6600",
  },
  {
    icon: FileWarning,
    titleKey: "whyLose.card2.title" as const,
    descKey: "whyLose.card2.desc" as const,
    color: "#ff983f",
  },
  {
    icon: ShieldAlert,
    titleKey: "whyLose.card3.title" as const,
    descKey: "whyLose.card3.desc" as const,
    color: "#cc5200",
  },
  {
    icon: Swords,
    titleKey: "whyLose.card4.title" as const,
    descKey: "whyLose.card4.desc" as const,
    color: "#ff983f",
  },
] as const;

export function WhyLoseSales() {
  const t = useT();
  return (
    <Section id="why-lose-sales">
      <Container>
        <SectionHeader
          eyebrow={t("whyLose.eyebrow")}
          title={t("whyLose.title")}
          description={t("whyLose.subtitle")}
          className="mb-12"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROBLEMS.map((item, i) => (
            <BlurFade key={item.titleKey} delay={i * 0.06} className="h-full">
              <SurfaceCard className="p-5 sm:p-6">
                <span
                  className="size-10 rounded-lg grid place-items-center"
                  style={{ background: `${item.color}1a`, color: item.color }}
                >
                  <item.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{t(item.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
                  {t(item.descKey)}
                </p>
              </SurfaceCard>
            </BlurFade>
          ))}
        </div>

        <div className="mt-10 text-center">
          <StartAuditCta className="font-semibold h-11 px-7 rounded-full shadow-glow">
            {t("whyLose.cta")}
          </StartAuditCta>
          <p className="mt-3 text-xs text-muted-foreground">{t("whyLose.ctaSub")}</p>
        </div>
      </Container>
    </Section>
  );
}
