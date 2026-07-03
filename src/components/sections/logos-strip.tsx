"use client";

import { useT } from "@/lib/i18n";

const LOGOS = [
  "ArganBloom", "Nayra", "TechSouq", "Zid Store", "GulfCart", "MasrMarket", "RiyadhRetail", "CairoCommerce",
];

export function LogosStrip() {
  const t = useT();
  return (
    <section className="py-12 border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-7">
          {t("logos.title")}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-6 gap-y-5 items-center">
          {LOGOS.map((name, i) => (
            <div
              key={i}
              className="flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
            >
              <span className="size-5 rounded-md gradient-brand opacity-80" />
              <span className="font-display font-bold text-sm sm:text-base text-muted-foreground whitespace-nowrap">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
