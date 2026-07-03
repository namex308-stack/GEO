"use client";

import { motion } from "framer-motion";
import { useCountUp, formatNumber } from "@/hooks/use-count-up";
import { TrendingUp, FileSearch, Store, Star } from "lucide-react";
import { useT } from "@/lib/i18n";

const METRICS = [
  { icon: FileSearch, target: 2_400_000, suffix: "+", labelKey: "metrics.pagesAnalyzed", decimals: 0, color: "#FF6600" },
  { icon: TrendingUp, target: 184, prefix: "$", suffix: "M", labelKey: "metrics.revenueInfluenced", decimals: 0, color: "#ff983f" },
  { icon: Store, target: 1240, suffix: "+", labelKey: "metrics.storesAudited", decimals: 0, color: "#ff983f" },
  { icon: Star, target: 4.9, labelKey: "metrics.avgRating", decimals: 1, color: "#cc5200" },
] as const;

export function MetricsBand() {
  const t = useT();
  return (
    <section className="py-14 sm:py-16 border-y border-border/40 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t("metrics.title")}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {METRICS.map((m, i) => (
            <MetricItem key={i} {...m} label={t(m.labelKey)} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricItem({
  icon: Icon, target, prefix, suffix, label, decimals, color, index,
}: {
  icon: typeof TrendingUp; target: number; prefix?: string; suffix?: string;
  label: string; decimals: number; color: string; index: number;
}) {
  const { value, ref } = useCountUp(target);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="text-center"
    >
      <div className="mx-auto size-10 rounded-xl grid place-items-center mb-3" style={{ background: `${color}1a`, color }}>
        <Icon className="size-5" />
      </div>
      <div
        ref={ref}
        className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tabular-nums tracking-tight"
        style={{ color }}
      >
        {formatNumber(value, decimals, prefix, suffix)}
      </div>
      <div className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-[180px] mx-auto leading-snug">
        {label}
      </div>
    </motion.div>
  );
}
