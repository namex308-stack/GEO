"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  X, Check, Copy, Target, Clock, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Recommendation, ScorePillar } from "@/lib/types";
import type { PlanId } from "@/lib/billing/plans";
import { canAccessFeature } from "@/lib/plan-gates";
import { QuickFixes } from "@/components/audit/quick-fixes";

const PILLAR_LABELS: Record<ScorePillar, string> = {
  conversion: "Conversion",
  seo: "SEO",
  geo: "GEO / AI",
  trust: "Trust",
};

const SEVERITY_STYLES = {
  critical: "bg-rose-500/10 text-rose-500",
  warning: "bg-amber-500/10 text-amber-600",
  opportunity: "bg-primary/10 text-primary",
};

interface IssueCardProps {
  issue: Recommendation;
  userPlan: PlanId;
  index?: number;
}

export function IssueCard({ issue, userPlan, index = 0 }: IssueCardProps) {
  const canQuickFix = canAccessFeature(userPlan, "quickFixes");
  const showQuickFix = Boolean(issue.quickFix) && (issue.hasFix || !canQuickFix);

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border/60 bg-card overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{PILLAR_LABELS[issue.pillar]}</span>
          {issue.issueCode && (
            <span className="text-[10px] text-muted-foreground hidden sm:inline font-mono">
              {issue.issueCode}
            </span>
          )}
        </div>
        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", SEVERITY_STYLES[issue.severity])}>
          {issue.severity}
        </span>
      </div>

      <div className="p-4 space-y-3 flex-1">
        <div className="flex gap-2.5">
          <span className="size-5 rounded-full bg-rose-500/15 grid place-items-center shrink-0 mt-0.5">
            <X className="size-3 text-rose-500" />
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-0.5">Problem</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{issue.problem}</p>
          </div>
        </div>

        {issue.why && (
          <div className="flex gap-2.5">
            <span className="size-5 rounded-full bg-amber-500/15 grid place-items-center shrink-0 mt-0.5">
              <Target className="size-3 text-amber-600" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-0.5">Why it matters</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{issue.why}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2.5">
          <span className="size-5 rounded-full bg-primary/15 grid place-items-center shrink-0 mt-0.5">
            <Check className="size-3 text-primary" />
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">Solution</div>
            <p className="text-sm text-foreground/90 leading-relaxed">{issue.solution}</p>
          </div>
        </div>

        {showQuickFix && issue.quickFix && (
          <QuickFixes quickFix={issue.quickFix} userPlan={userPlan} />
        )}
      </div>

      <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="flex items-center gap-1 font-semibold">
          <Target className="size-3" /> {issue.impact} impact
        </span>
        {issue.effort && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="size-3" /> {issue.effort}
            </span>
          </>
        )}
        {issue.estimatedLift && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1 font-bold text-primary">
              <TrendingUp className="size-3" /> {issue.estimatedLift}
            </span>
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-7 px-2 text-[11px] rounded-full"
          onClick={() => copyText(issue.solution, "Solution")}
        >
          <Copy className="size-3 mr-1" /> Copy fix
        </Button>
      </div>
    </motion.div>
  );
}
