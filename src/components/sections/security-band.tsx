"use client";

import { ShieldCheck, Lock, Server, FileCheck2, Eye, KeyRound } from "lucide-react";
import { Container, Section, SectionHeader, SurfaceCard } from "@/components/design-system/section";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useT, type TranslationKey } from "@/lib/i18n";

const ITEMS = [
  { icon: ShieldCheck, titleKey: "security.s1.title" as const, descKey: "security.s1.desc" as const },
  { icon: Lock, titleKey: "security.s2.title" as const, descKey: "security.s2.desc" as const },
  { icon: Server, titleKey: "security.s3.title" as const, descKey: "security.s3.desc" as const },
  { icon: KeyRound, titleKey: "security.s4.title" as const, descKey: "security.s4.desc" as const },
  { icon: FileCheck2, titleKey: "security.s5.title" as const, descKey: "security.s5.desc" as const },
  { icon: Eye, titleKey: "security.s6.title" as const, descKey: "security.s6.desc" as const },
] as const;

/** Honest posture badges — no unverified certifications. */
const POSTURE_KEYS: readonly TranslationKey[] = [
  "security.posture.tls",
  "security.posture.encryptedSecrets",
  "security.posture.leastPrivilege",
  "security.posture.auditLogging",
];

export function SecurityBand() {
  const t = useT();
  return (
    <Section id="security" tone="muted">
      <Container>
        <div className="grid lg:grid-cols-[1fr_1.35fr] gap-12 items-start">
          <div className="lg:sticky lg:top-24">
            <SectionHeader
              eyebrow={t("security.eyebrow")}
              title={t("security.title")}
              description={t("security.subtitle")}
            />
            <BlurFade delay={0.1}>
              <div className="mt-6 flex flex-wrap gap-2">
                {POSTURE_KEYS.map((key) => (
                  <span
                    key={key}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-border/60 bg-card text-foreground/80"
                  >
                    {t(key)}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed max-w-md">
                {t("security.complianceNote")}
              </p>
            </BlurFade>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {ITEMS.map((item, i) => (
              <BlurFade key={item.titleKey} delay={i * 0.05} className="h-full">
                <SurfaceCard className="p-5">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-3">
                    <item.icon className="size-4" aria-hidden />
                  </div>
                  <h3 className="font-display font-semibold text-sm">{t(item.titleKey)}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed flex-1">{t(item.descKey)}</p>
                </SurfaceCard>
              </BlurFade>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
