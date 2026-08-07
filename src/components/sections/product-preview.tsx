"use client";

import Image from "next/image";
import { ArrowRight, LayoutDashboard, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Section, SectionHeader } from "@/components/design-system/section";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useT } from "@/lib/i18n";

const SHOTS = [
  {
    src: "/product/audit-new.png",
    icon: Link2,
    titleKey: "productPreview.shot1.title" as const,
    captionKey: "productPreview.shot1.caption" as const,
  },
  {
    src: "/product/dashboard.png",
    icon: LayoutDashboard,
    titleKey: "productPreview.shot2.title" as const,
    captionKey: "productPreview.shot2.caption" as const,
  },
] as const;

/** Real product screenshots — no mockups, no fabricated scores. */
export function ProductPreview() {
  const t = useT();
  const { startAuditAndNavigate } = useNavigateAfterAction();

  return (
    <Section id="product-preview" tone="muted">
      <Container>
        <SectionHeader
          align="center"
          eyebrow={t("productPreview.eyebrow")}
          title={t("productPreview.title")}
          description={t("productPreview.subtitle")}
          className="mb-12"
        />

        <div className="grid md:grid-cols-2 gap-6">
          {SHOTS.map((shot, i) => (
            <BlurFade key={shot.src} delay={i * 0.08} className="h-full">
              <figure className="h-full flex flex-col">
                <div className="relative rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-elevated)] overflow-hidden">
                  <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 bg-muted/40">
                    <shot.icon className="size-4 text-primary shrink-0" aria-hidden />
                    <span className="text-sm font-semibold truncate">{t(shot.titleKey)}</span>
                  </div>
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={shot.src}
                      alt={t(shot.titleKey)}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover object-top"
                    />
                  </div>
                </div>
                <figcaption className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {t(shot.captionKey)}
                </figcaption>
              </figure>
            </BlurFade>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" onClick={startAuditAndNavigate} className="font-semibold h-11 px-7 rounded-full shadow-glow group">
            {t("productPreview.cta")}
            <ArrowRight className="size-4 ms-0.5 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">{t("productPreview.ctaSub")}</p>
        </div>
      </Container>
    </Section>
  );
}
