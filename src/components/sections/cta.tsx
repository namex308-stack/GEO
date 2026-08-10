"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useT } from "@/lib/i18n";
import { Container, Section } from "@/components/design-system/section";
import { BlurFade } from "@/components/magicui/blur-fade";
import { ShineBorder } from "@/components/magicui/shine-border";
import { DotPattern } from "@/components/magicui/dot-pattern";

export function CTA() {
  const t = useT();
  const { startAuditAndNavigate, startAuditHref } = useNavigateAfterAction();
  return (
    <Section>
      <Container className="max-w-5xl">
        <BlurFade>
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-8 sm:p-12 text-center shadow-[var(--shadow-elevated)]">
            <ShineBorder shineColor={["#FF6600", "#ff983f", "#FF6600"]} borderWidth={1} duration={12} />
            <DotPattern className="opacity-30 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                {t("cta.badge")}
              </p>
              <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance">
                {t("cta.title")}
              </h2>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
                {t("cta.subtitle")}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild className="h-11 px-7 font-semibold group">
                  <Link
                    href={startAuditHref}
                    onClick={(e) => {
                      e.preventDefault();
                      startAuditAndNavigate();
                    }}
                  >
                    {t("cta.button")}
                    <ArrowRight className="size-4 ms-0.5 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{t("cta.social")}</p>
            </div>
          </div>
        </BlurFade>
      </Container>
    </Section>
  );
}
