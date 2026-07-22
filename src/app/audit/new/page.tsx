"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Link2,
  Store,
  Swords,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Bot,
  Loader2,
  Globe,
  Check,
  Lock,
  Crown,
  ChevronUp,
  AlertCircle,
  FileText,
  Search,
  ShieldCheck,
  Zap,
  Gauge,
  Settings,
  Wrench,
  Wand2,
  Eye,
} from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { generateAuditId } from "@/lib/audit-store";
import {
  classifyAuditUrl,
  extractStoreUrlFromProductUrl,
  type AuditUrlType,
} from "@/lib/url-validation";
import type { PlanId } from "@/lib/billing/plans";
import { canAccessFeature, canRunAudit } from "@/lib/plan-gates";
import { crumbsForPath } from "@/lib/nav-config";
import { patchFlowState } from "@/lib/workflow/flow-state";

type AuditType = "single" | "crawl";

interface BillingState {
  plan: PlanId;
  auditsUsed: number;
  limits: {
    auditsPerMonth: number | null;
    canCrawl: boolean;
    crawlMaxPages: number | null;
    canCompare: boolean;
    canExportPdf: boolean;
  };
}

type UrlStatus =
  | { state: "idle" }
  | { state: "validating" }
  | { state: "valid"; type: AuditUrlType; label: string }
  | { state: "invalid"; reason: string };

interface SummaryItem {
  label: string;
  included: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  emoji?: string;
}

export default function AuditNewPage() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Prefill from ?url= / ?productUrl= / ?siteUrl= during the initial render
  // (classifyAuditUrl is pure) instead of a setState-in-effect cascade.
  const prefillUrl =
    searchParams.get("url") ||
    searchParams.get("productUrl") ||
    searchParams.get("siteUrl") ||
    "";

  const [productUrl, setProductUrl] = React.useState(prefillUrl);
  const [storeUrl, setStoreUrl] = React.useState(() => {
    if (!prefillUrl) return "";
    const result = classifyAuditUrl(prefillUrl.trim());
    return result.valid
      ? extractStoreUrlFromProductUrl(prefillUrl.trim()) ?? ""
      : "";
  });
  const [storeUrlManual, setStoreUrlManual] = React.useState(false);
  const [showStoreField, setShowStoreField] = React.useState(false);
  const [competitorUrl, setCompetitorUrl] = React.useState("");
  const [auditType, setAuditType] = React.useState<AuditType>("single");
  const [urlStatus, setUrlStatus] = React.useState<UrlStatus>(() => {
    if (!prefillUrl) return { state: "idle" };
    const result = classifyAuditUrl(prefillUrl.trim());
    return result.valid
      ? { state: "valid", type: result.type, label: result.label }
      : { state: "idle" };
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [billing, setBilling] = React.useState<BillingState | null>(null);
  const [billingLoading, setBillingLoading] = React.useState(true);

  const validateTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    fetch("/api/billing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.plan) {
          setBilling({
            plan: data.plan,
            auditsUsed: data.auditsUsed ?? 0,
            limits: {
              auditsPerMonth: data.limits?.auditsPerMonth ?? 3,
              canCrawl: data.limits?.canCrawl ?? false,
              crawlMaxPages: data.limits?.crawlMaxPages ?? 0,
              canCompare: data.limits?.canCompare ?? false,
              canExportPdf: data.limits?.canExportPdf ?? false,
            },
          });
        }
      })
      .catch(() => {})
      .finally(() => setBillingLoading(false));
  }, []);

  const runValidation = React.useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setUrlStatus({ state: "idle" });
        return;
      }

      setUrlStatus({ state: "validating" });

      const result = classifyAuditUrl(trimmed);
      if (!result.valid) {
        setUrlStatus({ state: "invalid", reason: result.reason });
        return;
      }

      setUrlStatus({
        state: "valid",
        type: result.type,
        label: result.label,
      });

      if (!storeUrlManual) {
        const detected = extractStoreUrlFromProductUrl(trimmed);
        if (detected) setStoreUrl(detected);
      }
    },
    [storeUrlManual]
  );

  const handleProductUrlChange = (value: string) => {
    setProductUrl(value);
    if (validateTimer.current) clearTimeout(validateTimer.current);
    if (!value.trim()) {
      setUrlStatus({ state: "idle" });
      if (!storeUrlManual) setStoreUrl("");
      return;
    }
    validateTimer.current = setTimeout(() => runValidation(value), 300);
  };

  const handleProductPaste = (value: string) => {
    if (validateTimer.current) clearTimeout(validateTimer.current);
    runValidation(value);
  };

  const handleStoreUrlChange = (value: string) => {
    setStoreUrlManual(true);
    setStoreUrl(value);
  };

  const urlValid = urlStatus.state === "valid";
  const plan = billing?.plan ?? "free";
  const limits = billing?.limits;
  const canCrawl = limits?.canCrawl ?? false;
  const canCompare = canAccessFeature(plan, "competitor") || (limits?.canCompare ?? false);
  const canExportPdf = canAccessFeature(plan, "pdf") || (limits?.canExportPdf ?? false);
  const hasProFeatures = canAccessFeature(plan, "quickFixes");
  const crawlMaxPages = limits?.crawlMaxPages ?? 0;
  const auditsUsed = billing?.auditsUsed ?? 0;
  const auditLimit = limits?.auditsPerMonth ?? 3;
  const remainingAudits =
    auditLimit === null ? null : Math.max(0, auditLimit - auditsUsed);
  const limitReached = billing ? !canRunAudit(plan, auditsUsed) : false;
  const fullCrawl = canCrawl && auditType === "crawl";

  const handleSubmit = async () => {
    if (!urlValid || limitReached) return;

    setSubmitting(true);

    const auditId = generateAuditId();
    const params = new URLSearchParams({ productUrl: productUrl.trim() });

    if (storeUrl) params.set("storeUrl", storeUrl);
    if (competitorUrl && canCompare) params.set("competitorUrl", competitorUrl);

    if (fullCrawl && canCrawl) {
      params.set("fullCrawl", "true");
      params.set("siteUrl", storeUrl || productUrl.trim());
    }

    params.set("auditId", auditId);
    void patchFlowState({
      lastAuditId: auditId,
      flowStep: "scanning",
      connectedWebsite: storeUrl || productUrl.trim(),
    });
    router.push(`/audit/${auditId}/scanning?${params.toString()}`);
  };

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  const freeSummaryItems: SummaryItem[] = [
    { label: t("auditNew.overallScore"), included: true, icon: Gauge },
    { label: t("auditNew.seoScore"), included: true, icon: Search },
    { label: t("auditNew.geoScore"), included: true, icon: Bot },
    { label: t("auditNew.trustScore"), included: true, icon: ShieldCheck },
    { label: t("auditNew.croScore"), included: true, icon: Zap },
    { label: t("auditNew.aiRecommendations"), included: true, icon: Sparkles, emoji: "🧠" },
  ];

  const premiumSummaryItems: SummaryItem[] = [
    { label: t("auditNew.quickFixes"), included: hasProFeatures, icon: Wrench, emoji: "🛠️" },
    { label: t("auditNew.contentImprover"), included: hasProFeatures, icon: Wand2, emoji: "🪄" },
    { label: t("auditNew.pdfReport"), included: canExportPdf, icon: FileText, emoji: "📄" },
  ];

  return (
    <PageShell>
      <PageHeader
        title={t("auditNew.title")}
        subtitle={t("auditNew.subtitle")}
        icon={Link2}
        back="/dashboard"
        crumbs={crumbsForPath("/audit/new")}
      />
      <PageContent className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden"
        >
          {/* Subscription status */}
          {!billingLoading && billing && (
            <div className="px-6 sm:px-8 pt-6 sm:pt-8">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                    <span>
                      <span className="text-muted-foreground">{t("auditNew.currentPlan")}: </span>
                      <span className="font-semibold">{planLabel}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">{t("auditNew.remainingAudits")}: </span>
                      <span className="font-semibold">
                        {remainingAudits === null ? t("auditNew.unlimited") : remainingAudits}
                      </span>
                    </span>
                  </div>
                  {limitReached && (
                    <Button asChild size="sm" className="rounded-full shadow-glow h-8">
                      <Link href="/pricing">
                        <Crown className="size-3.5 ml-1" /> {t("dashboard.upgrade")}
                      </Link>
                    </Button>
                  )}
                </div>
                {limitReached && (
                  <p className="mt-2 text-xs text-rose-500">{t("auditNew.limitReached")}</p>
                )}
              </div>
            </div>
          )}

          {/* ── 1. Header / Product URL ── */}
          <section className="px-6 sm:px-8 pt-6 sm:pt-8 pb-6 border-b border-border/50">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {t("auditNew.productUrl")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t("auditNew.productUrlDesc")}
            </p>
            <p className="mt-2 text-xs text-muted-foreground/90 leading-relaxed">
              {t("auditNew.tip")}
            </p>

            <div className="mt-5 space-y-2">
              <Label htmlFor="product" className="sr-only">
                {t("auditNew.productUrl")}
              </Label>
              <Input
                id="product"
                type="url"
                inputMode="url"
                placeholder={t("auditNew.productPlaceholder")}
                value={productUrl}
                onChange={(e) => handleProductUrlChange(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  setTimeout(() => handleProductPaste(pasted), 0);
                }}
                className={cn(
                  "h-12 text-sm",
                  urlStatus.state === "invalid" && "border-rose-500",
                  urlStatus.state === "valid" && "border-emerald-500/60"
                )}
                autoFocus
                disabled={submitting}
              />

              {urlStatus.state === "validating" && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" /> {t("auditNew.urlValidating")}
                </p>
              )}
              {urlStatus.state === "valid" && (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                  <Check className="size-3.5 shrink-0" />
                  {t("auditNew.urlDetected", {
                    type:
                      urlStatus.type === "product_page"
                        ? t("auditNew.urlProductPage")
                        : t("auditNew.urlStoreHomepage"),
                  })}
                </p>
              )}
              {urlStatus.state === "invalid" && (
                <p className="text-xs text-rose-500 flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" /> {urlStatus.reason}
                </p>
              )}
            </div>

            {/* Edit store URL manually */}
            <div className="mt-4">
              {!showStoreField ? (
                <button
                  type="button"
                  onClick={() => setShowStoreField(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  disabled={submitting}
                >
                  <Settings className="size-3.5" />
                  {t("auditNew.editStoreUrl")}
                </button>
              ) : (
                <div className="mt-2 space-y-2 rounded-lg border border-border/50 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      <Store className="size-4 text-muted-foreground" />
                      {t("auditNew.storeUrl")}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({t("onboarding.store.optional")})
                      </span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowStoreField(false)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                    >
                      <ChevronUp className="size-3.5" /> Hide
                    </button>
                  </div>
                  {storeUrl && !storeUrlManual && (
                    <p className="text-xs text-muted-foreground">{t("auditNew.storeAutoDetected")}</p>
                  )}
                  <Input
                    type="url"
                    placeholder="https://shop.example.com"
                    value={storeUrl}
                    onChange={(e) => handleStoreUrlChange(e.target.value)}
                    className="h-11 text-sm"
                    disabled={submitting}
                  />
                </div>
              )}
            </div>
          </section>

          {/* ── 2. Audit Type ── */}
          <section className="px-6 sm:px-8 py-6 border-b border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {t("auditNew.auditType")}
            </h3>
            <RadioGroup
              value={fullCrawl ? "crawl" : "single"}
              onValueChange={(v) => {
                if (v === "crawl" && !canCrawl) return;
                setAuditType(v as AuditType);
              }}
              className="gap-3"
              disabled={submitting}
            >
              {/* Single Page — unlocked */}
              <label
                htmlFor="audit-single"
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all",
                  auditType === "single"
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border/60 hover:border-border hover:bg-muted/20"
                )}
              >
                <RadioGroupItem value="single" id="audit-single" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{t("auditNew.singlePage")}</div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t("auditNew.singlePageDesc")}
                  </p>
                </div>
              </label>

              {/* Full Website Crawl — locked for free */}
              <label
                htmlFor="audit-crawl"
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 transition-all",
                  canCrawl
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-80",
                  auditType === "crawl" && canCrawl
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border/60 bg-muted/10"
                )}
              >
                <RadioGroupItem
                  value="crawl"
                  id="audit-crawl"
                  disabled={!canCrawl}
                  className="mt-0.5"
                />
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Globe
                    className={cn(
                      "size-5 shrink-0 mt-0.5",
                      canCrawl ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{t("auditNew.fullCrawl")}</span>
                      {!canCrawl && (
                        <>
                          <Lock className="size-3.5 text-muted-foreground" aria-hidden />
                          <Badge
                            variant="outline"
                            className="rounded-full text-[10px] font-semibold px-2 py-0 border-brand/30 text-brand"
                          >
                            {t("auditNew.crawlProBadge")}
                          </Badge>
                          <Button
                            asChild
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs font-semibold text-primary"
                          >
                            <Link href="/pricing">{t("auditNew.upgrade")}</Link>
                          </Button>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {canCrawl
                        ? t("auditNew.fullCrawlDesc", { pages: String(crawlMaxPages) })
                        : t("auditNew.crawlLocked")}
                    </p>
                  </div>
                </div>
              </label>
            </RadioGroup>
          </section>

          {/* ── 3. Competitor Intelligence ── */}
          <section
            className={cn(
              "px-6 sm:px-8 py-6 border-b border-border/50",
              !canCompare && "bg-muted/20"
            )}
          >
            {canCompare ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                    <Swords className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      {t("auditNew.competitorIntelligenceTitle")}
                      <Badge variant="outline" className="rounded-full text-[10px] text-emerald-600 border-emerald-500/30">
                        Unlocked
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {t("auditNew.competitorIntelligenceDesc")}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    {t("auditNew.competitorUrl")}{" "}
                    <span className="font-normal">({t("onboarding.store.optional")})</span>
                  </Label>
                  <Input
                    type="url"
                    placeholder="https://competitor.com/products/similar"
                    value={competitorUrl}
                    onChange={(e) => setCompetitorUrl(e.target.value)}
                    className="h-11 text-sm"
                    disabled={submitting || fullCrawl}
                  />
                </div>
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex gap-2.5">
                  <Eye className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("auditNew.competitorTip")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <span className="size-10 rounded-xl bg-muted grid place-items-center shrink-0">
                  <Lock className="size-5 text-muted-foreground" />
                </span>
                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Lock className="size-3.5 text-muted-foreground" aria-hidden />
                    {t("auditNew.competitorIntelligenceTitle")}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t("auditNew.competitorIntelligenceDesc")}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground/80">
                    {t("auditNew.competitorIntelligenceStatus")}
                  </p>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="rounded-full mt-1 border-brand/40 text-brand hover:bg-brand/5"
                  >
                    <Link href="/pricing">
                      <Crown className="size-3.5 ml-1" />
                      {t("auditNew.upgradeToUnlock")}
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* ── 4. Audit Summary ── */}
          <section className="px-6 sm:px-8 py-6 border-b border-border/50">
            <h3 className="text-sm font-semibold mb-4">{t("auditNew.auditSummary")}</h3>

            {/* Free tier */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {freeSummaryItems.map((item) => (
                <SummaryRow key={item.label} item={item} />
              ))}
            </ul>

            {/* Premium tier divider */}
            <div className="my-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("auditNew.proBusiness")}
              </span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {premiumSummaryItems.map((item) => (
                <SummaryRow key={item.label} item={item} locked={!item.included} />
              ))}
            </ul>
          </section>

          {/* ── 5. Action Buttons ── */}
          <div className="px-6 sm:px-8 py-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Button variant="outline" asChild className="rounded-full">
              <Link href="/dashboard">
                <ArrowLeft className="size-4 ml-1" /> {t("auditNew.cancel")}
              </Link>
            </Button>
            <Button
              disabled={!urlValid || submitting || limitReached}
              onClick={handleSubmit}
              size="lg"
              className="rounded-full font-semibold px-8 shadow-glow disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin ml-1" />
                  {t("auditNew.processing")}
                </>
              ) : (
                <>
                  {fullCrawl && canCrawl ? t("auditNew.runFullCrawl") : t("auditNew.runAudit")}
                  <ArrowRight className="size-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </PageContent>
    </PageShell>
  );
}

function SummaryRow({
  item,
  locked = false,
}: {
  item: SummaryItem;
  locked?: boolean;
}) {
  const Icon = item.icon;

  return (
    <li
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
        locked ? "bg-muted/30 text-muted-foreground" : "bg-emerald-500/5 text-foreground"
      )}
    >
      {locked ? (
        <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
      )}
      {item.emoji && (
        <span className="text-sm leading-none" aria-hidden>
          {item.emoji}
        </span>
      )}
      {Icon && !item.emoji && <Icon className="size-3.5 shrink-0 text-primary" />}
      <span className={cn("flex-1 min-w-0", locked && "opacity-80")}>{item.label}</span>
      {locked && (
        <Badge
          variant="outline"
          className="rounded-full text-[10px] font-medium px-1.5 py-0 shrink-0 border-border/60"
        >
          Pro & Business
        </Badge>
      )}
    </li>
  );
}
