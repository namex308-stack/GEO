"use client";

import Link from "next/link";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  canAccessFeature,
  type PlanFeature,
} from "@/lib/plan-gates";
import type { PlanId } from "@/lib/billing/plans";
import { useT } from "@/lib/i18n";

const FEATURE_LABEL_KEYS: Record<PlanFeature, "planGate.feature.pdf" | "planGate.feature.quickFixes" | "planGate.feature.contentImprover" | "planGate.feature.competitor" | "planGate.feature.watchdog" | "planGate.feature.generate" | "planGate.feature.crawl"> = {
  pdf: "planGate.feature.pdf",
  quickFixes: "planGate.feature.quickFixes",
  contentImprover: "planGate.feature.contentImprover",
  competitor: "planGate.feature.competitor",
  watchdog: "planGate.feature.watchdog",
  generate: "planGate.feature.generate",
  crawl: "planGate.feature.crawl",
};

interface PlanGateProps {
  plan: PlanId;
  feature: PlanFeature;
  children: React.ReactNode;
  /** When denied, render this instead of the default upgrade prompt. */
  fallback?: React.ReactNode;
  /** Wrap denied state in a bordered card (default true). */
  bordered?: boolean;
  className?: string;
}

export function PlanGate({
  plan,
  feature,
  children,
  fallback,
  bordered = true,
  className,
}: PlanGateProps) {
  if (canAccessFeature(plan, feature)) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <PlanGateUpgradePrompt feature={feature} bordered={bordered} className={className} />
  );
}

export function PlanGateUpgradePrompt({
  feature,
  bordered = true,
  className,
}: {
  feature: PlanFeature;
  bordered?: boolean;
  className?: string;
}) {
  const t = useT();
  const featureLabel = t(FEATURE_LABEL_KEYS[feature]);

  return (
    <div
      className={
        className ??
        (bordered
          ? "rounded-xl border border-dashed border-primary/40 bg-primary/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          : "flex flex-col sm:flex-row items-center justify-between gap-4 p-4")
      }
    >
      <div className="flex items-center gap-3">
        <Lock className="size-5 text-brand shrink-0" />
        <p className="text-sm text-muted-foreground">
          {t("planGate.upgradeMessage", { feature: featureLabel })}
        </p>
      </div>
      <Button asChild size="sm" className="rounded-full shrink-0">
        <Link href="/pricing">
          <Crown className="size-4 mr-1" /> {t("planGate.upgradeCta")}
        </Link>
      </Button>
    </div>
  );
}
