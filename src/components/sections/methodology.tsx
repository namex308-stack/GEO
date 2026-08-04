"use client";

import { Scale, Bot, Search, Zap, ShieldCheck, FlaskConical } from "lucide-react";
import { Container, Section, SectionHeader, SurfaceCard } from "@/components/design-system/section";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useT } from "@/lib/i18n";

const PILLARS = [
  {
    icon: Zap,
    titleKey: "methodology.conversion.title" as const,
    descKey: "methodology.conversion.desc" as const,
    weightKey: "methodology.conversion.weight" as const,
  },
  {
    icon: Search,
    titleKey: "methodology.seo.title" as const,
    descKey: "methodology.seo.desc" as const,
    weightKey: "methodology.seo.weight" as const,
  },
  {
    icon: Bot,
    titleKey: "methodology.geo.title" as const,
    descKey: "methodology.geo.desc" as const,
    weightKey: "methodology.geo.weight" as const,
  },
  {
    icon: ShieldCheck,
    titleKey: "methodology.trust.title" as const,
    descKey: "methodology.trust.desc" as const,
    weightKey: "methodology.trust.weight" as const,
  },
] as const;

const AI_STEPS = [
  { titleKey: "methodology.ai.s1.title" as const, descKey: "methodology.ai.s1.desc" as const },
  { titleKey: "methodology.ai.s2.title" as const, descKey: "methodology.ai.s2.desc" as const },
  { titleKey: "methodology.ai.s3.title" as const, descKey: "methodology.ai.s3.desc" as const },
  { titleKey: "methodology.ai.s4.title" as const, descKey: "methodology.ai.s4.desc" as const },
] as const;

export function Methodology() {
  const t = useT();
  return (
    <Section id="methodology">
      <Container>
        <SectionHeader
          eyebrow={t("methodology.eyebrow")}
          title={t("methodology.title")}
          description={t("methodology.subtitle")}
          className="mb-12"
        />

        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-start">
          <BlurFade>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <Scale className="size-5" aria-hidden />
                </span>
                <h3 className="font-display text-lg font-semibold">{t("methodology.scoring.title")}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("methodology.scoring.desc")}
              </p>
              <ul className="mt-5 space-y-3">
                {(["methodology.scoring.r1", "methodology.scoring.r2", "methodology.scoring.r3"] as const).map((key) => (
                  <li key={key} className="flex gap-2.5 text-sm text-foreground/90">
                    <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </BlurFade>

          <div className="grid sm:grid-cols-2 gap-4">
            {PILLARS.map((p, i) => (
              <BlurFade key={p.titleKey} delay={i * 0.05} className="h-full">
                <SurfaceCard>
                  <div className="flex items-center gap-3">
                    <span className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                      <p.icon className="size-4" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-display font-semibold text-sm">{t(p.titleKey)}</h3>
                      <p className="text-[11px] text-muted-foreground font-medium">{t(p.weightKey)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground leading-relaxed flex-1">{t(p.descKey)}</p>
                </SurfaceCard>
              </BlurFade>
            ))}
          </div>
        </div>

        <div className="mt-14">
          <BlurFade>
            <div className="flex items-center gap-3 mb-6">
              <span className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <FlaskConical className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold">{t("methodology.ai.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("methodology.ai.subtitle")}</p>
              </div>
            </div>
          </BlurFade>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AI_STEPS.map((step, i) => (
              <BlurFade key={step.titleKey} delay={i * 0.05} className="h-full">
                <SurfaceCard>
                  <span className="text-xs font-mono font-bold text-primary">0{i + 1}</span>
                  <h4 className="mt-2 font-display font-semibold text-sm">{t(step.titleKey)}</h4>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed flex-1">{t(step.descKey)}</p>
                </SurfaceCard>
              </BlurFade>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
