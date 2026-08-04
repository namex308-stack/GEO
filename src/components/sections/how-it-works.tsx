"use client";

import { Link2, Cpu, FileCheck2 } from "lucide-react";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader, SurfaceCard } from "@/components/design-system/section";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useT } from "@/lib/i18n";

const STEPS = [
  { icon: Link2, step: "01", titleKey: "how.step1.title" as const, descKey: "how.step1.desc" as const },
  { icon: Cpu, step: "02", titleKey: "how.step2.title" as const, descKey: "how.step2.desc" as const },
  { icon: FileCheck2, step: "03", titleKey: "how.step3.title" as const, descKey: "how.step3.desc" as const },
] as const;

export function HowItWorks() {
  const t = useT();
  const { startAuditAndNavigate } = useNavigateAfterAction();
  return (
    <Section id="how" tone="muted">
      <Container>
        <SectionHeader
          align="center"
          eyebrow={t("how.eyebrow")}
          title={t("how.title")}
          description={t("how.subtitle")}
          className="mb-12"
        />

        <div className="grid md:grid-cols-3 gap-4 relative">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-border" aria-hidden />
          {STEPS.map((s, i) => (
            <BlurFade key={s.step} delay={i * 0.08} className="h-full">
              <SurfaceCard className="text-center relative z-10">
                <div className="mx-auto size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
                  <s.icon className="size-5" aria-hidden />
                </div>
                <div className="text-xs font-mono font-bold text-primary mb-1">{s.step}</div>
                <h3 className="font-display text-lg font-semibold">{t(s.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{t(s.descKey)}</p>
              </SurfaceCard>
            </BlurFade>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" onClick={startAuditAndNavigate} className="font-semibold h-11 px-7">
            {t("how.cta")}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">{t("how.ctaSub")}</p>
        </div>
      </Container>
    </Section>
  );
}
