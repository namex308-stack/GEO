"use client";

import { Zap, Search, Bot, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader, SurfaceCard } from "@/components/design-system/section";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useT } from "@/lib/i18n";

/** GEO leads — it is the core differentiator vs. generic CRO tools. */
const PILLARS = [
  {
    icon: Bot,
    nameKey: "features.geo.name" as const,
    eyebrow: "01",
    color: "#cc5200",
    descKey: "features.geo.desc" as const,
    pointKeys: [
      "features.geo.p1",
      "features.geo.p2",
      "features.geo.p3",
      "features.geo.p4",
    ] as const,
  },
  {
    icon: Zap,
    nameKey: "features.conversion.name" as const,
    eyebrow: "02",
    color: "#FF6600",
    descKey: "features.conversion.desc" as const,
    pointKeys: [
      "features.conversion.p1",
      "features.conversion.p2",
      "features.conversion.p3",
      "features.conversion.p4",
    ] as const,
  },
  {
    icon: Search,
    nameKey: "features.seo.name" as const,
    eyebrow: "03",
    color: "#ff983f",
    descKey: "features.seo.desc" as const,
    pointKeys: [
      "features.seo.p1",
      "features.seo.p2",
      "features.seo.p3",
      "features.seo.p4",
    ] as const,
  },
  {
    icon: ShieldCheck,
    nameKey: "features.trust.name" as const,
    eyebrow: "04",
    color: "#929292",
    descKey: "features.trust.desc" as const,
    pointKeys: [
      "features.trust.p1",
      "features.trust.p2",
      "features.trust.p3",
      "features.trust.p4",
    ] as const,
  },
] as const;

export function Features() {
  const t = useT();
  const { startAuditAndNavigate } = useNavigateAfterAction();
  return (
    <Section id="features">
      <Container>
        <SectionHeader
          eyebrow={t("features.eyebrow")}
          title={t("features.title")}
          description={t("features.subtitle")}
          className="mb-12"
        />

        <div className="grid sm:grid-cols-2 gap-4">
          {PILLARS.map((p, i) => (
            <BlurFade key={p.eyebrow} delay={i * 0.06} className="h-full">
              <SurfaceCard className="p-6 sm:p-7">
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="size-12 rounded-xl grid place-items-center"
                    style={{ background: `${p.color}1a`, color: p.color }}
                  >
                    <p.icon className="size-6" aria-hidden />
                  </div>
                  <span className="font-display text-2xl font-bold opacity-20" style={{ color: p.color }}>
                    {p.eyebrow}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold">{t(p.nameKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(p.descKey)}</p>
                <ul className="mt-5 space-y-2.5">
                  {p.pointKeys.map((ptKey) => (
                    <li key={ptKey} className="flex items-start gap-2.5 text-sm text-foreground/85">
                      <span className="mt-1.5 size-1.5 rounded-full shrink-0" style={{ background: p.color }} aria-hidden />
                      {t(ptKey)}
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            </BlurFade>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" onClick={startAuditAndNavigate} className="font-semibold h-11 px-7">
            {t("features.cta")}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">{t("features.ctaSub")}</p>
        </div>
      </Container>
    </Section>
  );
}
