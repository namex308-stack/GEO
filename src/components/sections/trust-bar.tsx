"use client";

import { useT } from "@/lib/i18n";

const PLATFORMS = [
  "Shopify", "WooCommerce", "Salla", "Zid", "Magento", "Wix", "Custom", "Affiliate",
];

export function TrustBar() {
  const t = useT();
  return (
    <section className="py-10 border-y border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6">
          {t("trustBar.title")}
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex gap-12 animate-marquee whitespace-nowrap">
            {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
              <span
                key={i}
                className="font-display text-xl sm:text-2xl font-bold text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
