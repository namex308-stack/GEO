"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Swords,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Activity,
  Zap,
  ShieldCheck,
  Search,
  ListChecks,
  Check,
  Loader2,
  Lock,
  Clock,
  Globe2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import type { AuditData } from "@/lib/types";

const REPORT_FEATURES = [
  {
    id: "health",
    icon: Activity,
    titleKey: "auditNew.feature.health.title" as const,
    descKey: "auditNew.feature.health.desc" as const,
  },
  {
    id: "conversion",
    icon: Zap,
    titleKey: "auditNew.feature.conversion.title" as const,
    descKey: "auditNew.feature.conversion.desc" as const,
  },
  {
    id: "trust",
    icon: ShieldCheck,
    titleKey: "auditNew.feature.trust.title" as const,
    descKey: "auditNew.feature.trust.desc" as const,
  },
  {
    id: "visibility",
    icon: Search,
    titleKey: "auditNew.feature.visibility.title" as const,
    descKey: "auditNew.feature.visibility.desc" as const,
  },
  {
    id: "competitor",
    icon: Swords,
    titleKey: "auditNew.feature.competitor.title" as const,
    descKey: "auditNew.feature.competitor.desc" as const,
    requiresCompetitor: true,
  },
  {
    id: "actionPlan",
    icon: ListChecks,
    titleKey: "auditNew.feature.actionPlan.title" as const,
    descKey: "auditNew.feature.actionPlan.desc" as const,
  },
] as const;

const REASSURANCES = [
  { icon: Check, key: "auditNew.reassure.noInstall" as const },
  { icon: Clock, key: "auditNew.reassure.fast" as const },
  { icon: Globe2, key: "auditNew.reassure.platforms" as const },
  { icon: Lock, key: "auditNew.reassure.secure" as const },
] as const;

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(normalizeUrl(raw));
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

function storeOriginFromProduct(productUrl: string): string {
  try {
    return new URL(productUrl).origin;
  } catch {
    return "";
  }
}

export default function AuditNewPage() {
  const t = useT();
  const router = useRouter();
  const setLastAudit = useAppStore((s) => s.setLastAudit);
  const incrementAudits = useAppStore((s) => s.incrementAudits);

  const [productUrl, setProductUrl] = React.useState("");
  const [storeUrl, setStoreUrl] = React.useState("");
  const [competitorUrl, setCompetitorUrl] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding");
        if (!res.ok) return;
        const data = (await res.json()) as {
          onboarding?: { storeUrl?: string; competitorUrl?: string; completed?: boolean; resumePath?: string };
        };
        if (cancelled || !data.onboarding) return;
        if (!data.onboarding.completed) {
          window.location.href = data.onboarding.resumePath || "/onboarding";
          return;
        }
        if (data.onboarding.storeUrl) setStoreUrl(data.onboarding.storeUrl);
        if (data.onboarding.competitorUrl) setCompetitorUrl(data.onboarding.competitorUrl);
      } catch {
        /* non-blocking prefills */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const productValid = isValidHttpUrl(productUrl);
  const storeFilled = storeUrl.trim().length > 0;
  const storeValid = !storeFilled || isValidHttpUrl(storeUrl);
  const competitorFilled = competitorUrl.trim().length > 0;
  const competitorValid = !competitorFilled || isValidHttpUrl(competitorUrl);
  const hasCompetitor = competitorFilled && isValidHttpUrl(competitorUrl);

  const productError = (() => {
    if (!touched) return null;
    if (!productUrl.trim()) return t("auditNew.urlEmpty");
    if (!productValid) return t("auditNew.urlError");
    return null;
  })();

  const storeError = (() => {
    if (!touched || !storeFilled) return null;
    if (!storeValid) return t("auditNew.urlError");
    return null;
  })();

  const competitorError = (() => {
    if (!touched || !competitorFilled) return null;
    if (!competitorValid) return t("auditNew.urlError");
    return null;
  })();

  const visibleFeatures = REPORT_FEATURES.filter(
    (f) => !("requiresCompetitor" in f && f.requiresCompetitor) || hasCompetitor
  );

  const startAnalysis = async () => {
    setTouched(true);
    setErrorMessage(null);
    if (!productValid || !storeValid || !competitorValid) return;

    const normalizedProduct = normalizeUrl(productUrl);
    const normalizedStore = storeFilled
      ? normalizeUrl(storeUrl)
      : storeOriginFromProduct(normalizedProduct);
    const normalizedCompetitor = hasCompetitor ? normalizeUrl(competitorUrl) : "";

    setAnalyzing(true);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUrl: normalizedProduct,
          storeUrl: normalizedStore || "",
          competitorUrl: normalizedCompetitor,
          locale: "ar",
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        resumePath?: string;
        audit?: AuditData & { id?: string };
        meta?: {
          auditId?: string | null;
          warning?: string;
          demoMode?: { gemini?: boolean; firecrawl?: boolean };
        };
      };

      if (!res.ok) {
        if (data.code === "ONBOARDING_REQUIRED") {
          window.location.href = data.resumePath || "/onboarding";
          return;
        }
        const message =
          data.error ||
          (res.status === 503
            ? t("auditNew.scrapingUnavailable")
            : res.status === 422
              ? t("auditNew.urlUnreachable")
              : t("auditNew.auditFailed"));
        setErrorMessage(message);
        toast.error(message);
        setAnalyzing(false);
        return;
      }

      if (data.meta?.warning) {
        toast.message(data.meta.warning);
      }

      const auditId = data.meta?.auditId || data.audit?.id;
      const auditPayload: AuditData = {
        ...(data.audit as AuditData),
        id: auditId,
        demoMode: data.audit?.demoMode ?? data.meta?.demoMode?.gemini,
      };

      setLastAudit(auditPayload);
      incrementAudits();
      toast.success(t("report.auditComplete"));

      if (!auditId) {
        setErrorMessage(t("auditNew.noAuditId"));
        toast.error(t("auditNew.persistError"));
        setAnalyzing(false);
        return;
      }

      router.push(`/audit/${auditId}/report`);
    } catch {
      const message = t("auditNew.urlUnreachable");
      setErrorMessage(message);
      toast.error(message);
      setAnalyzing(false);
    }
  };

  return (
    <PageShell>
      <PageHeader title={t("auditNew.title")} subtitle={t("auditNew.subtitle")} icon={Store} back="/dashboard" />
      <PageContent className="max-w-2xl">
        <AnimatePresence mode="wait">
          {analyzing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm text-center"
            >
              <div className="mx-auto size-14 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow mb-4 relative">
                <Loader2 className="size-7 animate-spin" />
                <span className="absolute inset-0 rounded-2xl border-2 border-primary/40 animate-pulse-ring" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">{t("auditNew.analyzingCta")}</h2>
              <p className="mt-2 text-muted-foreground text-sm">{t("auditNew.pipeline.subtitle")}</p>
              <p className="mt-4 text-xs text-muted-foreground break-all">{normalizeUrl(productUrl)}</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
                <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
                  <Store className="size-6" />
                </div>
                <h2 className="font-display text-2xl font-bold">{t("auditNew.title")}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t("auditNew.valueProp")}</p>

                <div className="mt-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="product" className="flex items-center gap-1.5 text-sm font-medium">
                      <Globe2 className="size-4" />
                      {t("auditNew.productUrl")} <span className="text-rose-500">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">{t("auditNew.productUrlDesc")}</p>
                    <Input
                      id="product"
                      type="url"
                      inputMode="url"
                      placeholder={t("auditNew.productPlaceholder")}
                      value={productUrl}
                      onChange={(e) => {
                        setProductUrl(e.target.value);
                        setTouched(false);
                        setErrorMessage(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void startAnalysis();
                      }}
                      className={cn("h-12 text-sm", productError && "border-rose-500")}
                      autoFocus
                      disabled={analyzing}
                    />
                    {productError && <p className="text-xs text-rose-500">{productError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="store"
                      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
                    >
                      <Store className="size-4" />
                      {t("auditNew.storeUrl")}{" "}
                      <span className="font-normal">({t("auditNew.competitorOptional")})</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">{t("auditNew.storeUrlDesc")}</p>
                    <Input
                      id="store"
                      type="url"
                      inputMode="url"
                      placeholder={t("auditNew.storePlaceholder")}
                      value={storeUrl}
                      onChange={(e) => {
                        setStoreUrl(e.target.value);
                        setTouched(false);
                      }}
                      className={cn("h-12 text-sm", storeError && "border-rose-500")}
                      disabled={analyzing}
                    />
                    {storeError && <p className="text-xs text-rose-500">{storeError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="competitor"
                      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
                    >
                      <Swords className="size-4" />
                      {t("auditNew.competitorUrl")}{" "}
                      <span className="font-normal">({t("auditNew.competitorOptional")})</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">{t("auditNew.competitorDesc")}</p>
                    <Input
                      id="competitor"
                      type="url"
                      inputMode="url"
                      placeholder={t("auditNew.competitorPlaceholder")}
                      value={competitorUrl}
                      onChange={(e) => {
                        setCompetitorUrl(e.target.value);
                        setTouched(false);
                      }}
                      className={cn("h-12 text-sm", competitorError && "border-rose-500")}
                      disabled={analyzing}
                    />
                    {competitorError && <p className="text-xs text-rose-500">{competitorError}</p>}
                  </div>
                </div>

                {hasCompetitor && (
                  <div className="mt-5 rounded-lg bg-primary/5 border border-primary/20 p-3.5 flex gap-2.5">
                    <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{t("auditNew.competitorTip")}</p>
                  </div>
                )}

                <div className="mt-5 rounded-lg bg-muted/50 p-3.5 flex gap-2.5">
                  <Shield className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">{t("auditNew.tip")}</p>
                </div>

                {errorMessage && (
                  <div className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3.5 text-sm text-rose-600">
                    {errorMessage}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between gap-3">
                  <Button variant="ghost" asChild className="rounded-full">
                    <Link href="/dashboard">
                      <ArrowLeft className="size-4 me-1 rtl:rotate-180" /> {t("auditNew.cancel")}
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void startAnalysis()}
                    disabled={analyzing || (touched && (!productValid || !storeValid || !competitorValid))}
                    className="rounded-full font-semibold px-7 shadow-glow disabled:opacity-40"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="size-4 me-1 animate-spin" />
                        {t("auditNew.analyzingCta")}
                      </>
                    ) : (
                      <>
                        {t("auditNew.runAudit")}
                        <ArrowRight className="size-4 ms-1 rtl:rotate-180" />
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-display text-lg font-bold mb-3">{t("auditNew.reportIncludes")}</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <AnimatePresence initial={false}>
                    {visibleFeatures.map((feature, i) => (
                      <motion.div
                        key={feature.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded-xl border border-border/60 bg-card p-4 shadow-sm"
                      >
                        <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center mb-3">
                          <feature.icon className="size-4" aria-hidden />
                        </div>
                        <div className="text-sm font-semibold">{t(feature.titleKey)}</div>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {t(feature.descKey)}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/60 p-4 sm:p-5">
                <ul className="grid sm:grid-cols-2 gap-3">
                  {REASSURANCES.map((item) => (
                    <li key={item.key} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <span className="size-6 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0 mt-0.5">
                        <item.icon className="size-3.5" aria-hidden />
                      </span>
                      <span className="leading-relaxed pt-0.5">{t(item.key)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageContent>
    </PageShell>
  );
}
