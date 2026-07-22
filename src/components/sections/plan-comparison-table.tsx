"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";
import { PLAN_COMPARISON_ROWS, type ComparisonCell } from "@/lib/billing/plans";

const COLS = [
  { key: "free" as const, nameKey: "pricing.free" as TranslationKey, tone: "muted" as const },
  { key: "pro" as const, nameKey: "pricing.pro" as TranslationKey, tone: "brand" as const },
  { key: "business" as const, nameKey: "pricing.business" as TranslationKey, tone: "muted" as const },
];

export function PlanComparisonTable() {
  const t = useT();

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t("planCompare.eyebrow")}
          </span>
          <h2 className="mt-3 font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-balance">
            {t("planCompare.title")}
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border border-border/60 bg-card overflow-x-auto"
        >
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr]">
              <div className="p-4 sm:p-5" />
              {COLS.map((c) => (
                <div
                  key={c.key}
                  className={cn(
                    "p-4 sm:p-5 border-l border-border/40 text-center text-sm font-semibold",
                    c.tone === "brand" && "bg-primary/5 text-primary"
                  )}
                >
                  {t(c.nameKey)}
                </div>
              ))}
            </div>

            {PLAN_COMPARISON_ROWS.map((row, i) => (
              <div
                key={row.labelKey}
                className={cn(
                  "grid grid-cols-[1.6fr_1fr_1fr_1fr] border-t border-border/40",
                  i % 2 === 1 && "bg-muted/20"
                )}
              >
                <div className="p-3.5 sm:p-4 text-xs sm:text-sm font-medium text-foreground/80">
                  {t(row.labelKey as TranslationKey)}
                </div>
                {COLS.map((c) => {
                  const cell = row[c.key];
                  return (
                    <div
                      key={c.key}
                      className={cn(
                        "p-3.5 sm:p-4 border-l border-border/40 flex flex-col items-center justify-center gap-1",
                        c.tone === "brand" && "bg-primary/5"
                      )}
                    >
                      <CellIcon v={cell} brand={c.tone === "brand"} />
                      {row.noteKey && cell !== "no" && (
                        <span className="text-[10px] text-muted-foreground text-center">
                          {t(row.noteKey as TranslationKey)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CellIcon({ v, brand }: { v: ComparisonCell; brand?: boolean }) {
  if (v === "yes") {
    return (
      <span
        className={cn(
          "size-6 rounded-full grid place-items-center",
          brand ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (v === "no") {
    return (
      <span className="size-6 rounded-full bg-rose-500/10 grid place-items-center text-rose-500">
        <X className="size-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span className="size-6 rounded-full bg-brand/10 grid place-items-center text-brand">
      <Minus className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}
