"use client";

import { Marquee } from "@/components/magicui/marquee";
import { Container } from "@/components/design-system/section";
import { useT, type TranslationKey } from "@/lib/i18n";

/** Supported platforms — not customer logos. Brand names stay Latin. */
const PLATFORM_KEYS: readonly TranslationKey[] = [
  "logos.shopify",
  "logos.wooCommerce",
  "logos.salla",
  "logos.zid",
  "logos.magento",
  "logos.customStorefronts",
];

export function LogosStrip() {
  const t = useT();
  return (
    <section className="py-10 border-y border-border/50 bg-muted/20" aria-label={t("logos.title")}>
      <Container>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-6">
          {t("logos.title")}
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <Marquee pauseOnHover className="[--duration:36s] [--gap:3rem]">
            {PLATFORM_KEYS.map((key) => (
              <span
                key={key}
                className="font-display text-base sm:text-lg font-semibold text-muted-foreground/70 whitespace-nowrap"
              >
                {t(key)}
              </span>
            ))}
          </Marquee>
        </div>
      </Container>
    </section>
  );
}
