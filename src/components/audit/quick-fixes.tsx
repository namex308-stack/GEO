"use client";

import * as React from "react";
import { Copy, Wrench, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { QuickFixPayload } from "@/lib/types";
import type { PlanId } from "@/lib/billing/plans";
import { canAccessFeature } from "@/lib/plan-gates";
import { PlanGateUpgradePrompt } from "@/components/ui/plan-gate";
import { useT } from "@/lib/i18n";

export interface QuickFixesProps {
  quickFix: QuickFixPayload;
  userPlan: PlanId;
  /** Controlled open state (optional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Pro-only copy-to-clipboard Quick Fixes panel.
 * Free users see the upgrade prompt (same layout as before).
 */
export function QuickFixes({
  quickFix,
  userPlan,
  open: controlledOpen,
  onOpenChange,
}: QuickFixesProps) {
  const t = useT();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const canQuickFix = canAccessFeature(userPlan, "quickFixes");
  const fixOpen = controlledOpen ?? internalOpen;

  const setFixOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (controlledOpen === undefined) setInternalOpen(next);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(t("quickFixes.copied", { label }));
  };

  return (
    <div className="mt-2 rounded-xl border border-border/60 overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="size-4 text-primary" />
          <span className="text-sm font-semibold">
            {quickFix.title ?? t("quickFixes.defaultTitle")}
          </span>
          {!canQuickFix && (
            <Badge variant="outline" className="rounded-full text-[10px] gap-1 border-brand/40 text-brand">
              <Lock className="size-3" /> {t("quickFixes.proBadge")}
            </Badge>
          )}
        </div>
        {canQuickFix && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs rounded-full"
            onClick={() => setFixOpen(!fixOpen)}
          >
            {fixOpen ? <ChevronUp className="size-3 mr-1" /> : <ChevronDown className="size-3 mr-1" />}
            {t("quickFixes.fixNow")}
          </Button>
        )}
      </div>

      {!canQuickFix ? (
        <div className="p-4">
          <PlanGateUpgradePrompt feature="quickFixes" bordered={false} />
        </div>
      ) : (
        fixOpen && (
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">{quickFix.description}</p>
            <div className="relative">
              <pre className="rounded-lg bg-zinc-950 text-zinc-100 p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap border border-zinc-800">
                {quickFix.codeSnippet}
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 h-7 px-2 text-[10px] rounded-full"
                onClick={() => copyText(quickFix.codeSnippet, t("quickFixes.codeSnippet"))}
              >
                <Copy className="size-3 mr-1" /> {t("quickFixes.copy")}
              </Button>
            </div>
            {quickFix.steps.length > 0 && (
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                {quickFix.steps.map((step, i) => (
                  <li key={i} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            )}
          </div>
        )
      )}
    </div>
  );
}
