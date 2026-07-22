"use client";

import * as React from "react";
import { Sparkles, Copy, Loader2, Lock, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { PlanId } from "@/lib/billing/plans";
import { canAccessFeature } from "@/lib/plan-gates";
import { PlanGateUpgradePrompt } from "@/components/ui/plan-gate";

type ContentType = "title" | "description";

interface ContentImproverProps {
  userPlan: PlanId;
}

export function ContentImprover({ userPlan }: ContentImproverProps) {
  const [originalText, setOriginalText] = React.useState("");
  const [contentType, setContentType] = React.useState<ContentType>("title");
  const [improvedText, setImprovedText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const allowed = canAccessFeature(userPlan, "contentImprover");

  const handleGenerate = async () => {
    if (!allowed) {
      toast.error("Content Improver requires a Pro or Business plan.");
      return;
    }

    if (!originalText.trim()) {
      toast.error("Enter some text to improve.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/improve-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: originalText.trim(),
          contentType,
          userPlan,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Generation failed");
        return;
      }

      setImprovedText(data.improvedText ?? "");
      if (data.aiEnhanced === false) {
        toast.warning("AI unavailable — showing original text.");
      } else {
        toast.success("Content improved!");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!improvedText) return;
    navigator.clipboard?.writeText(improvedText);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="size-11 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow shrink-0">
              <Wand2 className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                Content Improver
                {!allowed && (
                  <Badge variant="outline" className="rounded-full text-xs gap-1 border-brand/40 text-brand">
                    <Lock className="size-3" /> Pro
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Rewrite titles and descriptions to be highly converting, sales-focused, and professional.
              </p>
            </div>
          </div>
        </div>

        {!allowed && <PlanGateUpgradePrompt feature="contentImprover" />}

        <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="content-type">Content type</Label>
            <Select
              value={contentType}
              onValueChange={(v) => setContentType(v as ContentType)}
              disabled={!allowed}
            >
              <SelectTrigger id="content-type" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="description">Description</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="original-text">Original text</Label>
          <Textarea
            id="original-text"
            placeholder={
              contentType === "title"
                ? "e.g. Wireless Earbuds Pro Model X"
                : "Paste your current product description here…"
            }
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            rows={contentType === "title" ? 3 : 8}
            disabled={!allowed}
            className="resize-y min-h-[80px]"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={!allowed || loading || !originalText.trim()}
          className="rounded-full"
        >
          {loading ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="size-4 mr-2" />
          )}
          Generate (AI)
        </Button>
      </div>

      {(improvedText || loading) && (
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="improved-text">Improved result</Label>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full h-8"
              onClick={copyToClipboard}
              disabled={!improvedText}
            >
              <Copy className="size-3 mr-1" /> Copy to Clipboard
            </Button>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin mr-2" />
              Rewriting with Gemini…
            </div>
          ) : (
            <Textarea
              id="improved-text"
              value={improvedText}
              onChange={(e) => setImprovedText(e.target.value)}
              rows={contentType === "title" ? 4 : 10}
              className="resize-y font-medium leading-relaxed"
            />
          )}
        </div>
      )}
    </div>
  );
}
