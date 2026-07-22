"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import type { FlowStep } from "@/lib/workflow/flow-state";
import { patchFlowState } from "@/lib/workflow/flow-state";
import { cn } from "@/lib/utils";

const REPORT_STEPS: FlowStep[] = [
  "report",
  "customerEye",
  "priorityFixes",
  "recommendations",
  "generate",
];

export function GuidedFlowRail({
  auditId,
  step,
  onStepChange,
  className,
}: {
  auditId: string;
  step: FlowStep;
  onStepChange: (step: FlowStep) => void;
  className?: string;
}) {
  const t = useT();

  const advance = async (next: FlowStep, scrollId?: string) => {
    onStepChange(next);
    await patchFlowState({ flowStep: next, lastAuditId: auditId });
    if (scrollId) {
      document.getElementById(scrollId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  let label = t("guided.continue");
  let hint = t("guided.nextCustomerEye");
  let action: (() => void) | null = null;
  let href: string | null = null;

  if (step === "report" || step === "scanning") {
    hint = t("guided.nextCustomerEye");
    action = () => void advance("customerEye", "guided-customer-eye");
  } else if (step === "customerEye") {
    hint = t("guided.nextPriority");
    label = t("guided.continue");
    action = () => void advance("priorityFixes", "guided-priority-fixes");
  } else if (step === "priorityFixes") {
    hint = t("guided.nextRecommendations");
    label = t("guided.applyFixes");
    action = () => void advance("recommendations", "guided-recommendations");
  } else if (step === "recommendations") {
    hint = t("guided.nextGenerate");
    label = t("guided.generateContent");
    href = `/audit/${auditId}/generate`;
    action = () => {
      void patchFlowState({ flowStep: "generate", lastAuditId: auditId });
    };
  } else if (step === "generate") {
    hint = t("guided.nextExport");
    label = t("guided.continue");
    action = () => void advance("export", "guided-export");
  } else if (step === "export") {
    hint = t("guided.goDashboard");
    label = t("guided.exportReport");
    action = async () => {
      window.open(`/api/audit/${auditId}/pdf`, "_blank");
      await patchFlowState({
        flowStep: "done",
        flowComplete: "true",
        lastAuditId: auditId,
      });
      window.location.href = "/dashboard";
    };
  }

  if (!REPORT_STEPS.includes(step) && step !== "export" && step !== "scanning") {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 inset-x-4 z-40 mx-auto max-w-lg rounded-2xl border border-border/60 bg-card/95 backdrop-blur shadow-lg p-4 flex flex-col sm:flex-row items-center gap-3",
        className
      )}
    >
      <p className="text-xs text-muted-foreground flex-1 text-center sm:text-start">{hint}</p>
      {href ? (
        <Button asChild className="rounded-full font-semibold shrink-0" onClick={() => action?.()}>
          <Link href={href}>
            {label} <ArrowRight className="size-4 ml-1" />
          </Link>
        </Button>
      ) : (
        <Button
          className="rounded-full font-semibold shrink-0"
          onClick={() => action?.()}
          disabled={!action}
        >
          {label} <ArrowRight className="size-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
