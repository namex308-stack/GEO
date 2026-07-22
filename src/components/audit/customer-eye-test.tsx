"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { CustomerEyeTest, Recommendation, ScoreBreakdown } from "@/lib/types";
import { useT } from "@/lib/i18n";

export interface CustomerEyeTestCardProps {
  /** Mapped from audits.eye_test_result (or engine_results.customerEyeTest). */
  eye: CustomerEyeTest;
  auditId: string;
  productUrl: string;
  overallScore: number;
  breakdown: ScoreBreakdown[];
  recommendations: Recommendation[];
}

/** Displays Customer Eye Test / eye_test_result data. */
export function CustomerEyeTestCard({
  eye,
  auditId,
  productUrl,
  overallScore,
  breakdown,
  recommendations,
}: CustomerEyeTestCardProps) {
  const t = useT();
  const router = useRouter();
  const [fixing, setFixing] = React.useState(false);
  const confused = eye.confusionScore > 60;

  const levelLabel = (level: "low" | "mid" | "high") => {
    if (level === "low") return t("customerEye.level.low");
    if (level === "mid") return t("customerEye.level.mid");
    return t("customerEye.level.high");
  };

  const handleFixWithAi = async () => {
    setFixing(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUrl,
          auditId,
          auditContext: {
            overallScore,
            breakdown,
            recommendations,
            customerEyeBlocker: eye.mainBlocker,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || t("customerEye.fixError"));
        return;
      }
      try {
        sessionStorage.setItem(`gen:${auditId}`, JSON.stringify(data.content));
      } catch {
        /* ignore quota */
      }
      toast.success(t("customerEye.fixReady"));
      router.push(`/audit/${auditId}/generate?from=customerEye`);
    } catch {
      toast.error(t("customerEye.fixError"));
    } finally {
      setFixing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8"
    >
      <div className="flex items-center gap-2 mb-5">
        <Eye className="size-5 text-primary" />
        <h2 className="font-display text-xl font-bold">{t("customerEye.title")}</h2>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">{t("customerEye.confusionScore")}</span>
          <span className={cn("text-xs font-bold tabular-nums", confused ? "text-rose-500" : "text-foreground")}>
            {eye.confusionScore}/100
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: confused ? "#f43f5e" : "#FF6600" }}
            initial={{ width: 0 }}
            whileInView={{ width: `${Math.min(eye.confusionScore, 100)}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      <h3 className="font-display text-xl sm:text-2xl font-bold leading-snug">{eye.mainBlocker}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{eye.firstImpression}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full border-border/60 bg-background/50">
          {t("customerEye.trust")}: {levelLabel(eye.trustLevel)}
        </Badge>
        <Badge variant="outline" className="rounded-full border-border/60 bg-background/50">
          {t("customerEye.buyingIntent")}: {levelLabel(eye.buyingIntent)}
        </Badge>
      </div>

      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
          {t("customerEye.topQuestion")}
        </div>
        <p className="text-sm font-semibold leading-relaxed">{eye.topQuestion}</p>
      </div>

      <Button
        className="mt-6 rounded-full shadow-glow"
        onClick={handleFixWithAi}
        disabled={fixing}
      >
        {fixing ? <Loader2 className="size-4 ml-1 animate-spin" /> : <Sparkles className="size-4 ml-1" />}
        {t("customerEye.fixWithAi")}
      </Button>
    </motion.div>
  );
}
