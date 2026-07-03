"use client";

import { motion } from "framer-motion";
import { Check, X, Minus, Building2, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const COLS = [
  { key: "diy", nameKey: "compTable.diy", icon: User, tone: "muted" },
  { key: "agency", nameKey: "compTable.agency", icon: Building2, tone: "muted" },
  { key: "storepulse", nameKey: "compTable.storepulse", icon: Sparkles, tone: "brand" },
] as const;

type Cell = { v: "yes" | "no" | "partial"; textKey?: "compTable.daysWeeks" | "compTable.weeks" | "compTable.seconds" | "compTable.freeTime" | "compTable.costAgency" | "compTable.from0" | "compTable.manual" | "compTable.extraCost" | "compTable.retainer" | "compTable.onYou" | "compTable.varies" };

const ROWS: { labelKey: "compTable.row1" | "compTable.row2" | "compTable.row3" | "compTable.row4" | "compTable.row5" | "compTable.row6" | "compTable.row7" | "compTable.row8"; cells: Record<string, Cell> }[] = [
  {
    labelKey: "compTable.row1",
    cells: { diy: { v: "no", textKey: "compTable.daysWeeks" }, agency: { v: "partial", textKey: "compTable.weeks" }, storepulse: { v: "yes", textKey: "compTable.seconds" } },
  },
  {
    labelKey: "compTable.row2",
    cells: { diy: { v: "partial", textKey: "compTable.freeTime" }, agency: { v: "no", textKey: "compTable.costAgency" }, storepulse: { v: "yes", textKey: "compTable.from0" } },
  },
  {
    labelKey: "compTable.row3",
    cells: { diy: { v: "no" }, agency: { v: "no" }, storepulse: { v: "yes" } },
  },
  {
    labelKey: "compTable.row4",
    cells: { diy: { v: "partial", textKey: "compTable.manual" }, agency: { v: "yes" }, storepulse: { v: "yes" } },
  },
  {
    labelKey: "compTable.row5",
    cells: { diy: { v: "no" }, agency: { v: "partial", textKey: "compTable.extraCost" }, storepulse: { v: "yes" } },
  },
  {
    labelKey: "compTable.row6",
    cells: { diy: { v: "no" }, agency: { v: "partial", textKey: "compTable.retainer" }, storepulse: { v: "yes" } },
  },
  {
    labelKey: "compTable.row7",
    cells: { diy: { v: "partial", textKey: "compTable.manual" }, agency: { v: "yes" }, storepulse: { v: "yes" } },
  },
  {
    labelKey: "compTable.row8",
    cells: { diy: { v: "partial", textKey: "compTable.onYou" }, agency: { v: "partial", textKey: "compTable.varies" }, storepulse: { v: "yes" } },
  },
] as const;

export function ComparisonTable() {
  const t = useT();
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t("compTable.eyebrow")}</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance">
            {t("compTable.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            {t("compTable.subtitle")}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border/60 bg-card overflow-hidden"
        >
          {/* header */}
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1.1fr] sm:grid-cols-[2fr_1fr_1fr_1.2fr]">
            <div className="p-4 sm:p-5" />
            {COLS.map((c) => (
              <div
                key={c.key}
                className={cn(
                  "p-4 sm:p-5 border-l border-border/40 flex flex-col items-center justify-center gap-1.5 text-center",
                  c.tone === "brand" && "bg-primary/5"
                )}
              >
                <span className={cn(
                  "size-9 rounded-xl grid place-items-center",
                  c.tone === "brand" ? "gradient-brand text-white" : "bg-muted text-muted-foreground"
                )}>
                  <c.icon className="size-5" />
                </span>
                <span className={cn(
                  "text-xs sm:text-sm font-semibold",
                  c.tone === "brand" && "text-primary"
                )}>
                  {t(c.nameKey)}
                </span>
              </div>
            ))}
          </div>

          {/* rows */}
          {ROWS.map((row, i) => (
            <div
              key={i}
              className={cn(
                "grid grid-cols-[1.4fr_1fr_1fr_1.1fr] sm:grid-cols-[2fr_1fr_1fr_1.2fr] border-t border-border/40",
                i % 2 === 1 && "bg-muted/20"
              )}
            >
              <div className="p-3.5 sm:p-4 text-xs sm:text-sm font-medium text-foreground/80">
                {t(row.labelKey)}
              </div>
              {COLS.map((c) => {
                const cell = row.cells[c.key];
                return (
                  <div
                    key={c.key}
                    className={cn(
                      "p-3.5 sm:p-4 border-l border-border/40 flex flex-col items-center justify-center text-center gap-1",
                      c.tone === "brand" && "bg-primary/5"
                    )}
                  >
                    <CellIcon v={cell.v} brand={c.tone === "brand"} />
                    {cell.textKey && (
                      <span className={cn(
                        "text-[10px] sm:text-xs",
                        cell.v === "yes" ? "text-primary font-medium" : "text-muted-foreground"
                      )}>
                        {t(cell.textKey)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CellIcon({ v, brand }: { v: Cell["v"]; brand?: boolean }) {
  if (v === "yes") {
    return (
      <span className={cn(
        "size-6 rounded-full grid place-items-center",
        brand ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary"
      )}>
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
