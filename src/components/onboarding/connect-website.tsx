"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/logo";
import { useT } from "@/lib/i18n";
import { classifyAuditUrl } from "@/lib/url-validation";
import { patchFlowState } from "@/lib/workflow/flow-state";
import { toast } from "sonner";

export function ConnectWebsiteStep({
  initialUrl,
  resume,
}: {
  initialUrl?: string;
  resume?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [url, setUrl] = React.useState(initialUrl ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const validate = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(null);
      return false;
    }
    const result = classifyAuditUrl(trimmed);
    if (!result.valid) {
      setError(result.reason);
      return false;
    }
    setError(null);
    return true;
  };

  const submit = async () => {
    const trimmed = url.trim();
    if (!validate(trimmed)) return;
    setSaving(true);
    try {
      const ok = await patchFlowState({
        connectedWebsite: trimmed,
        flowStep: "audit",
      });
      if (!ok) throw new Error("Failed to save");
      router.push("/onboarding/audit");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Logo className="h-8" />
      </div>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <span className="size-12 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow mx-auto mb-4">
            <Globe className="size-6" />
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t("onboarding.connect.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("onboarding.connect.subtitle")}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="website-url">URL</Label>
          <Input
            id="website-url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              validate(e.target.value);
            }}
            placeholder="https://store.example.com/product"
            className="rounded-xl"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button
          onClick={submit}
          disabled={saving || !url.trim() || !!error}
          className="w-full rounded-full font-semibold shadow-glow"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              {resume ? t("onboarding.connect.resume") : t("onboarding.connect.cta")}
              <ArrowRight className="size-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
