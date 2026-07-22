"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { useT } from "@/lib/i18n";
import { generateAuditId } from "@/lib/audit-store";
import { patchFlowState } from "@/lib/workflow/flow-state";
import { toast } from "sonner";

export function FirstAuditStep({
  websiteUrl,
  resume,
}: {
  websiteUrl: string;
  resume?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [starting, setStarting] = React.useState(false);

  const start = async () => {
    if (!websiteUrl) {
      router.push("/onboarding/connect");
      return;
    }
    setStarting(true);
    try {
      const auditId = generateAuditId();
      await patchFlowState({
        lastAuditId: auditId,
        flowStep: "scanning",
        connectedWebsite: websiteUrl,
      });
      const params = new URLSearchParams({
        productUrl: websiteUrl,
        auditId,
        guided: "1",
      });
      router.push(`/audit/${auditId}/scanning?${params.toString()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Logo className="h-8" />
      </div>
      <div className="w-full max-w-md space-y-6 text-center">
        <span className="size-12 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow mx-auto">
          <Sparkles className="size-6" />
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
          {t("onboarding.audit.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("onboarding.audit.subtitle")}
        </p>
        <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm font-medium truncate">
          {websiteUrl || "—"}
        </div>
        <Button
          onClick={start}
          disabled={starting || !websiteUrl}
          className="w-full rounded-full font-semibold shadow-glow"
        >
          {starting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {resume ? t("onboarding.audit.resume") : t("onboarding.audit.cta")}
              <ArrowRight className="size-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
