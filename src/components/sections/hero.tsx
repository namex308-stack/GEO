"use client";

import { ArrowRight, CheckCircle2, Search, Bot, ShieldCheck, Zap, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/magicui/blur-fade";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { Container } from "@/components/design-system/section";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const PILLARS = [
  { icon: Zap, labelKey: "hero.pillar.conversion" as const, color: "#FF6600" },
  { icon: Search, labelKey: "hero.pillar.seo" as const, color: "#ff983f" },
  { icon: Bot, labelKey: "hero.pillar.geo" as const, color: "#cc5200" },
  { icon: ShieldCheck, labelKey: "hero.pillar.trust" as const, color: "#929292" },
] as const;

const TRUST_POINTS = [
  { icon: CheckCircle2, labelKey: "hero.trust.noCard" as const },
  { icon: CheckCircle2, labelKey: "hero.trust.transparent" as const },
  { icon: CheckCircle2, labelKey: "hero.trust.platforms" as const },
] as const;

/** Marketing hero — no fabricated scores or sample store metrics. */
export function Hero() {
  const t = useT();
  const { startAuditAndNavigate } = useNavigateAfterAction();

  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" />
      <DotPattern className="opacity-40 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />

      <Container>
        <BlurFade className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              document.getElementById("why-lose-sales")?.scrollIntoView({ behavior: "smooth" });
            }}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/90 px-4 py-1.5 text-xs font-medium",
              "hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            )}
          >
            <AnimatedShinyText className="mx-0 max-w-none text-xs font-semibold text-primary dark:text-primary">
              {t("hero.badge")}
            </AnimatedShinyText>
            <ArrowRight className="size-3 rtl:rotate-180 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        </BlurFade>

        <BlurFade delay={0.05}>
          <h1 className="mt-8 text-center font-display text-[2.35rem] sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-balance max-w-4xl mx-auto">
            {t("hero.headline1")}{" "}
            <span className="gradient-text">{t("hero.headline3")}</span>
          </h1>
        </BlurFade>

        <BlurFade delay={0.1}>
          <p className="mt-5 text-center text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
            {t("hero.subheadline")}
          </p>
        </BlurFade>

        <BlurFade delay={0.15}>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={startAuditAndNavigate}
              className="h-11 px-7 font-semibold rounded-full shadow-glow group"
            >
              {t("hero.startFreeAudit")}
              <ArrowRight className="size-4 ms-0.5 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="h-11 px-7 font-semibold bg-card/80"
            >
              {t("hero.viewDemo")}
            </Button>
          </div>
        </BlurFade>

        <BlurFade delay={0.2}>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {TRUST_POINTS.map((item) => (
              <li key={item.labelKey} className="inline-flex items-center gap-1.5">
                <item.icon className="size-4 text-primary shrink-0" aria-hidden />
                <span>{t(item.labelKey)}</span>
              </li>
            ))}
          </ul>
        </BlurFade>

        <BlurFade delay={0.25} className="mt-14">
          <div className="relative rounded-xl border border-border/60 bg-card shadow-[var(--shadow-elevated)] overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border/60 bg-muted/40">
              <div className="flex items-center gap-1.5" aria-hidden>
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="text-xs font-medium text-primary">{t("hero.preview.liveLabel")}</div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
                <div>
                  <div className="mb-5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("hero.storeScore")}
                    </div>
                    <div className="font-display text-lg sm:text-xl font-bold mt-0.5">
                      {t("hero.preview.product")}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{t("hero.preview.sampleNote")}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {PILLARS.map((p) => (
                      <div key={p.labelKey} className="rounded-lg border border-border/50 bg-background/60 p-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-7 rounded-md grid place-items-center"
                            style={{ background: `${p.color}1a`, color: p.color }}
                          >
                            <p.icon className="size-3.5" />
                          </span>
                          <span className="text-xs font-semibold">{t(p.labelKey)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="size-4 text-primary" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("hero.pillar.geo")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t("hero.preview.geoNote")}
                    </p>
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-3">
                    <span className="size-9 rounded-md bg-primary/15 text-primary grid place-items-center shrink-0">
                      <FileSearch className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">{t("hero.criticalFixes")}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {t("hero.fixesDesc")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">{t("hero.preview.disclaimer")}</p>
        </BlurFade>
      </Container>
    </section>
  );
}
