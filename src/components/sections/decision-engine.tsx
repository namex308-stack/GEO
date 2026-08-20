"use client";

import { Flame, TrendingUp, Sparkles } from "lucide-react";
import { StartAuditCta } from "@/components/common/start-audit-cta";
import { Container, Section, SectionHeader, SurfaceCard } from "@/components/design-system/section";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useT, type TranslationKey } from "@/lib/i18n";

const PRIORITIES: {
  icon: typeof Flame;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  itemKeys: readonly TranslationKey[];
  accent: string;
  badge: string;
}[] = [
  {
    icon: Flame,
    titleKey: "decision.high.title",
    descKey: "decision.high.desc",
    itemKeys: ["decision.high.i1", "decision.high.i2", "decision.high.i3"],
    accent: "#FF6600",
    badge: "01",
  },
  {
    icon: TrendingUp,
    titleKey: "decision.growth.title",
    descKey: "decision.growth.desc",
    itemKeys: ["decision.growth.i1", "decision.growth.i2"],
    accent: "#ff983f",
    badge: "02",
  },
  {
    icon: Sparkles,
    titleKey: "decision.future.title",
    descKey: "decision.future.desc",
    itemKeys: ["decision.future.i1", "decision.future.i2"],
    accent: "#cc5200",
    badge: "03",
  },
];

export function DecisionEngine() {
  const t = useT();
  return (
    <Section id="decision-engine" tone="bordered">
      <Container>
        <SectionHeader
          align="center"
          eyebrow={t("decision.eyebrow")}
          title={t("decision.title")}
          description={t("decision.subtitle")}
          className="mb-12"
        />

        <div className="grid md:grid-cols-3 gap-4">
          {PRIORITIES.map((tier, i) => (
            <BlurFade key={tier.titleKey} delay={i * 0.06} className="h-full">
              <SurfaceCard className="p-6 sm:p-7">
                <div className="flex items-start justify-between mb-5">
                  <span
                    className="size-11 rounded-xl grid place-items-center"
                    style={{ background: `${tier.accent}1a`, color: tier.accent }}
                  >
                    <tier.icon className="size-5" aria-hidden />
                  </span>
                  <span
                    className="font-display text-2xl font-bold opacity-20"
                    style={{ color: tier.accent }}
                  >
                    {tier.badge}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold">{t(tier.titleKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(tier.descKey)}</p>
                <ul className="mt-5 space-y-2.5">
                  {tier.itemKeys.map((key) => (
                    <li key={key} className="flex items-start gap-2.5 text-sm text-foreground/85">
                      <span
                        className="mt-1.5 size-1.5 rounded-full shrink-0"
                        style={{ background: tier.accent }}
                        aria-hidden
                      />
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </SurfaceCard>
            </BlurFade>
          ))}
        </div>

        <div className="mt-10 text-center">
          <StartAuditCta className="font-semibold h-11 px-7">
            {t("decision.cta")}
          </StartAuditCta>
          <p className="mt-3 text-xs text-muted-foreground">{t("decision.ctaSub")}</p>
        </div>
      </Container>
    </Section>
  );
}
