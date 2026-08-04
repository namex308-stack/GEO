"use client";

import { ProgressBar } from "@/components/tremor/metric";
import { Layers, Gauge, Bot, Shield } from "lucide-react";
import { Container, Section, SectionHeader, SurfaceCard } from "@/components/design-system/section";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useT } from "@/lib/i18n";

/**
 * Capability metrics via Tremor ProgressBar + enterprise surfaces.
 * Values describe the product model — not fabricated usage statistics.
 */
const CAPABILITIES = [
  {
    icon: Layers,
    titleKey: "metrics.pillars.title" as const,
    metric: "4",
    unit: "pillars",
    descKey: "metrics.pillars.desc" as const,
    progress: 100,
  },
  {
    icon: Gauge,
    titleKey: "metrics.signals.title" as const,
    metric: "40+",
    unit: "checks",
    descKey: "metrics.signals.desc" as const,
    progress: 85,
  },
  {
    icon: Bot,
    titleKey: "metrics.engines.title" as const,
    metric: "3",
    unit: "AI engines",
    descKey: "metrics.engines.desc" as const,
    progress: 75,
  },
  {
    icon: Shield,
    titleKey: "metrics.severity.title" as const,
    metric: "3",
    unit: "levels",
    descKey: "metrics.severity.desc" as const,
    progress: 90,
  },
] as const;

export function MetricsBand() {
  const t = useT();
  return (
    <Section tone="bordered" className="py-16 sm:py-20">
      <Container>
        <SectionHeader
          align="center"
          eyebrow={t("metrics.title")}
          title={t("metrics.heading")}
          description={t("metrics.subtitle")}
          className="mb-10"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CAPABILITIES.map((item, i) => (
            <BlurFade key={item.titleKey} delay={i * 0.06} className="h-full">
              <SurfaceCard className="p-5" data-tremor-id="metric-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t(item.titleKey)}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums text-foreground">
                      {item.metric}
                      <span className="ms-1.5 text-base font-medium text-muted-foreground">{item.unit}</span>
                    </p>
                  </div>
                  <span className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                    <item.icon className="size-4" aria-hidden />
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
                  {t(item.descKey)}
                </p>
                <div className="mt-4">
                  <ProgressBar value={item.progress} color="orange" className="mt-1" />
                </div>
              </SurfaceCard>
            </BlurFade>
          ))}
        </div>
      </Container>
    </Section>
  );
}
