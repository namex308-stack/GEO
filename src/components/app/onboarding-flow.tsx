"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";
import {
  CATEGORY_OPTIONS,
  CHALLENGE_OPTIONS,
  COUNTRY_OPTIONS,
  GOAL_OPTIONS,
  LANGUAGE_OPTIONS,
  ONBOARDING_STEP_COUNT,
  ORDERS_OPTIONS,
  PLATFORM_OPTIONS,
  STORE_SIZE_OPTIONS,
  TRAFFIC_OPTIONS,
  isOptionalStep,
  onboardingPathForStep,
  platformLabel,
  stepNumberFromSlug,
  type OnboardingStepSlug,
} from "@/lib/onboarding/constants";
import { normalizeStoreUrl, STEP_SCHEMAS } from "@/lib/onboarding/schema";

type OnboardingStatePayload = {
  businessName: string;
  storeUrl: string;
  country: string;
  primaryLanguage: string;
  platform: string;
  storeSize: string;
  businessCategory: string;
  primaryGoal: string;
  monthlyTraffic: string;
  monthlyOrders: string;
  mainChallenge: string;
  competitorUrl: string;
  storeDomain: string;
  homepageTitle: string;
  platformConfidence: number | null;
  storeVerifiedAt: string | null;
  onboardingStep: number;
  completed: boolean;
  resumePath: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

const STEP_COPY: Record<OnboardingStepSlug, { titleKey: TranslationKey; subtitleKey: TranslationKey }> = {
  "business-name": {
    titleKey: "onboarding.step.business-name.title",
    subtitleKey: "onboarding.step.business-name.subtitle",
  },
  "store-url": {
    titleKey: "onboarding.step.store-url.title",
    subtitleKey: "onboarding.step.store-url.subtitle",
  },
  country: {
    titleKey: "onboarding.step.country.title",
    subtitleKey: "onboarding.step.country.subtitle",
  },
  language: {
    titleKey: "onboarding.step.language.title",
    subtitleKey: "onboarding.step.language.subtitle",
  },
  platform: {
    titleKey: "onboarding.step.platform.title",
    subtitleKey: "onboarding.step.platform.subtitle",
  },
  "store-size": {
    titleKey: "onboarding.step.store-size.title",
    subtitleKey: "onboarding.step.store-size.subtitle",
  },
  category: {
    titleKey: "onboarding.step.category.title",
    subtitleKey: "onboarding.step.category.subtitle",
  },
  goal: {
    titleKey: "onboarding.step.goal.title",
    subtitleKey: "onboarding.step.goal.subtitle",
  },
  traffic: {
    titleKey: "onboarding.step.traffic.title",
    subtitleKey: "onboarding.step.traffic.subtitle",
  },
  orders: {
    titleKey: "onboarding.step.orders.title",
    subtitleKey: "onboarding.step.orders.subtitle",
  },
  challenge: {
    titleKey: "onboarding.step.challenge.title",
    subtitleKey: "onboarding.step.challenge.subtitle",
  },
  competitor: {
    titleKey: "onboarding.step.competitor.title",
    subtitleKey: "onboarding.step.competitor.subtitle",
  },
};

function OptionGrid({
  options,
  value,
  onChange,
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-6 grid sm:grid-cols-2 gap-3">
      {options.map((opt, i) => (
        <motion.button
          key={opt.value}
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          onClick={() => onChange(opt.value)}
          className={cn(
            "group flex items-center gap-3 rounded-2xl border p-4 text-start transition-all",
            value === opt.value
              ? "border-primary bg-primary/5 shadow-glow"
              : "border-border/60 hover:border-primary/40 hover:bg-accent/40"
          )}
        >
          <div className="flex-1 font-semibold text-sm">{opt.label}</div>
          <span
            className={cn(
              "size-5 rounded-full border-2 grid place-items-center shrink-0",
              value === opt.value
                ? "border-primary bg-primary"
                : "border-border opacity-0 group-hover:opacity-100"
            )}
          >
            {value === opt.value && (
              <Check className="size-3 text-primary-foreground" strokeWidth={3} />
            )}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

function ProgressBar({ current }: { current: number }) {
  const t = useT();
  const pct = Math.round((current / ONBOARDING_STEP_COUNT) * 100);
  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("onboarding.stepOf", { current, total: ONBOARDING_STEP_COUNT })}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

function AutoSaveBadge({ status }: { status: SaveStatus }) {
  const t = useT();
  if (status === "idle") return null;
  return (
    <div className="flex justify-center mb-4">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
          status === "saving" && "border-border text-muted-foreground",
          status === "saved" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
          status === "error" && "border-rose-500/30 bg-rose-500/10 text-rose-600"
        )}
      >
        {status === "saving" && <Loader2 className="size-3 animate-spin" />}
        {status === "saved" && <CheckCircle2 className="size-3" />}
        {status === "saving"
          ? t("onboarding.saving")
          : status === "saved"
            ? t("settings.saved")
            : t("onboarding.saveFailed")}
      </span>
    </div>
  );
}

export function OnboardingFlow({ stepSlug }: { stepSlug: OnboardingStepSlug }) {
  const t = useT();
  const router = useRouter();
  const step = stepNumberFromSlug(stepSlug) ?? 1;
  const copy = STEP_COPY[stepSlug];
  const optional = isOptionalStep(stepSlug);

  const [loading, setLoading] = React.useState(true);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [form, setForm] = React.useState({
    businessName: "",
    storeUrl: "",
    country: "",
    primaryLanguage: "",
    platform: "",
    storeSize: "",
    businessCategory: "",
    primaryGoal: "",
    monthlyTraffic: "",
    monthlyOrders: "",
    mainChallenge: "",
    competitorUrl: "",
    storeDomain: "",
    homepageTitle: "",
    platformConfidence: null as number | null,
  });
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [verifyingStore, setVerifyingStore] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding");
        if (!res.ok) {
          if (res.status === 401) {
            router.replace(`/auth?next=${encodeURIComponent(`/onboarding/${stepSlug}`)}`);
            return;
          }
          throw new Error("Failed to load");
        }
        const data = (await res.json()) as { onboarding: OnboardingStatePayload };
        if (cancelled) return;
        const o = data.onboarding;
        if (o.completed) {
          router.replace("/dashboard");
          return;
        }
        // Resume: do not allow jumping ahead of first unanswered step.
        if (step > o.onboardingStep) {
          router.replace(o.resumePath);
          return;
        }
        setForm({
          businessName: o.businessName || "",
          storeUrl: o.storeUrl || "",
          country: o.country || "",
          primaryLanguage: o.primaryLanguage || "",
          platform: o.platform || "",
          storeSize: o.storeSize || "",
          businessCategory: o.businessCategory || "",
          primaryGoal: o.primaryGoal || "",
          monthlyTraffic: o.monthlyTraffic || "",
          monthlyOrders: o.monthlyOrders || "",
          mainChallenge: o.mainChallenge || "",
          competitorUrl: o.competitorUrl || "",
          storeDomain: o.storeDomain || "",
          homepageTitle: o.homepageTitle || "",
          platformConfidence: o.platformConfidence ?? null,
        });
      } catch {
        if (!cancelled) toast.error(t("onboarding.loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, step, stepSlug]);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldError(null);
  };

  const answersForStep = (override?: Partial<typeof form>): Record<string, string> => {
    const f = { ...form, ...override };
    switch (stepSlug) {
      case "business-name":
        return { businessName: f.businessName };
      case "store-url":
        return { storeUrl: normalizeStoreUrl(f.storeUrl) };
      case "country":
        return { country: f.country };
      case "language":
        return { primaryLanguage: f.primaryLanguage };
      case "platform":
        return { platform: f.platform };
      case "store-size":
        return { storeSize: f.storeSize };
      case "category":
        return { businessCategory: f.businessCategory };
      case "goal":
        return { primaryGoal: f.primaryGoal };
      case "traffic":
        return { monthlyTraffic: f.monthlyTraffic };
      case "orders":
        return { monthlyOrders: f.monthlyOrders };
      case "challenge":
        return { mainChallenge: f.mainChallenge };
      case "competitor":
        return {
          competitorUrl: f.competitorUrl.trim()
            ? normalizeStoreUrl(f.competitorUrl)
            : "",
        };
      default: {
        const _exhaustive: never = stepSlug;
        return _exhaustive;
      }
    }
  };

  const saveAndContinue = async (opts?: {
    skip?: boolean;
    answers?: Record<string, string>;
  }) => {
    setFieldError(null);
    const answers = opts?.answers ?? answersForStep();

    if (!opts?.skip) {
      const parsed = STEP_SCHEMAS[stepSlug].safeParse(answers);
      if (!parsed.success) {
        const first = parsed.error.issues[0]?.message || t("onboarding.pleaseComplete");
        setFieldError(first);
        return;
      }
    } else if (!optional) {
      setFieldError(t("onboarding.required"));
      return;
    }

    setSaveStatus("saving");
    if (stepSlug === "store-url" && !opts?.skip) {
      setVerifyingStore(true);
    }
    try {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step,
          answers,
          skip: opts?.skip === true,
          markComplete: step >= ONBOARDING_STEP_COUNT,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        onboarding?: OnboardingStatePayload;
      };
      if (!res.ok) {
        setSaveStatus("error");
        setFieldError(data.error || t("onboarding.saveStepError"));
        return;
      }
      if (data.onboarding) {
        setForm((prev) => ({
          ...prev,
          storeUrl: data.onboarding?.storeUrl || prev.storeUrl,
          platform: data.onboarding?.platform || prev.platform,
          storeDomain: data.onboarding?.storeDomain || prev.storeDomain,
          homepageTitle: data.onboarding?.homepageTitle || prev.homepageTitle,
          platformConfidence:
            data.onboarding?.platformConfidence ?? prev.platformConfidence,
        }));
      }
      setSaveStatus("saved");
      if (data.onboarding?.completed || step >= ONBOARDING_STEP_COUNT) {
        router.push("/onboarding/done");
        return;
      }
      // Advance linearly so auto-detected platform still shows the confirm step.
      router.push(onboardingPathForStep(step + 1));
    } catch {
      setSaveStatus("error");
      toast.error(t("onboarding.networkError"));
    } finally {
      setVerifyingStore(false);
    }
  };

  /** Option taps save + advance immediately (Supabase is source of truth). */
  const selectAndContinue = (
    key: keyof typeof form,
    value: string
  ) => {
    setField(key, value);
    void saveAndContinue({ answers: answersForStep({ [key]: value }) });
  };

  const backHref = step <= 1 ? "/auth" : onboardingPathForStep(step - 1);

  if (loading) {
    return (
      <PageShell>
        <PageContent className="max-w-2xl flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </PageContent>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContent className="max-w-2xl">
        <ProgressBar current={step} />
        <AutoSaveBadge status={saveStatus} />

        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" /> {t("onboarding.back")}
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-center">
            {t(copy.titleKey)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">{t(copy.subtitleKey)}</p>

          {stepSlug === "business-name" && (
            <div className="mt-8 space-y-2">
              <Label className="text-sm font-medium">
                {t("onboarding.field.businessName")} <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={form.businessName}
                onChange={(e) => setField("businessName", e.target.value)}
                className="h-12 rounded-xl text-sm"
                placeholder={t("onboarding.businessNamePlaceholder")}
                autoFocus
              />
            </div>
          )}

          {stepSlug === "store-url" && (
            <div className="mt-8 space-y-2">
              <Label className="text-sm font-medium">
                {t("onboarding.field.storeUrl")} <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="url"
                value={form.storeUrl}
                onChange={(e) => setField("storeUrl", e.target.value)}
                className="h-12 rounded-xl text-sm"
                placeholder="https://shop.example.com"
                autoFocus
                disabled={verifyingStore}
              />
              {verifyingStore && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Loader2 className="size-3.5 animate-spin" />
                  {t("onboarding.verifyingStore")}
                </p>
              )}
              {!verifyingStore && form.storeDomain && form.platform && (
                <p className="text-xs text-emerald-600 pt-1">
                  {t("onboarding.detectedPlatform", { platform: platformLabel(form.platform) })}
                  {form.platformConfidence != null
                    ? ` ${t("onboarding.confidencePct", { pct: Math.round(form.platformConfidence * 100) })}`
                    : ""}
                  {form.homepageTitle ? ` · ${form.homepageTitle}` : ""}
                </p>
              )}
            </div>
          )}

          {stepSlug === "country" && (
            <div className="mt-8 space-y-2">
              <Label className="text-sm font-medium">
                {t("onboarding.field.country")} <span className="text-rose-500">*</span>
              </Label>
              <select
                value={form.country}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    setField("country", v);
                    return;
                  }
                  selectAndContinue("country", v);
                }}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm"
                autoFocus
              >
                <option value="">{t("onboarding.select")}</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {stepSlug === "language" && (
            <div className="mt-8 space-y-2">
              <Label className="text-sm font-medium">
                {t("onboarding.field.primaryLanguage")} <span className="text-rose-500">*</span>
              </Label>
              <select
                value={form.primaryLanguage}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    setField("primaryLanguage", v);
                    return;
                  }
                  selectAndContinue("primaryLanguage", v);
                }}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm"
                autoFocus
              >
                <option value="">{t("onboarding.select")}</option>
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {stepSlug === "platform" && (
            <div>
              {form.platform && form.platformConfidence != null && (
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {t("onboarding.autoDetected", {
                    platform: platformLabel(form.platform),
                    pct: Math.round(form.platformConfidence * 100),
                  })}
                </p>
              )}
              <OptionGrid
                options={PLATFORM_OPTIONS}
                value={form.platform}
                onChange={(v) => selectAndContinue("platform", v)}
              />
            </div>
          )}

          {stepSlug === "store-size" && (
            <OptionGrid
              options={STORE_SIZE_OPTIONS}
              value={form.storeSize}
              onChange={(v) => selectAndContinue("storeSize", v)}
            />
          )}

          {stepSlug === "category" && (
            <OptionGrid
              options={CATEGORY_OPTIONS}
              value={form.businessCategory}
              onChange={(v) => selectAndContinue("businessCategory", v)}
            />
          )}

          {stepSlug === "goal" && (
            <OptionGrid
              options={GOAL_OPTIONS}
              value={form.primaryGoal}
              onChange={(v) => selectAndContinue("primaryGoal", v)}
            />
          )}

          {stepSlug === "traffic" && (
            <OptionGrid
              options={TRAFFIC_OPTIONS}
              value={form.monthlyTraffic}
              onChange={(v) => selectAndContinue("monthlyTraffic", v)}
            />
          )}

          {stepSlug === "orders" && (
            <OptionGrid
              options={ORDERS_OPTIONS}
              value={form.monthlyOrders}
              onChange={(v) => selectAndContinue("monthlyOrders", v)}
            />
          )}

          {stepSlug === "challenge" && (
            <OptionGrid
              options={CHALLENGE_OPTIONS}
              value={form.mainChallenge}
              onChange={(v) => selectAndContinue("mainChallenge", v)}
            />
          )}

          {stepSlug === "competitor" && (
            <div className="mt-8 space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {t("onboarding.field.competitorUrl")} ({t("onboarding.store.optional")})
              </Label>
              <Input
                type="url"
                value={form.competitorUrl}
                onChange={(e) => setField("competitorUrl", e.target.value)}
                className="h-12 rounded-xl text-sm"
                placeholder="https://competitor.com"
                autoFocus
              />
            </div>
          )}

          {fieldError && (
            <p className="mt-4 text-sm text-rose-500 text-center">{fieldError}</p>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button asChild variant="ghost" className="rounded-full">
              <Link href={backHref}>{t("onboarding.back")}</Link>
            </Button>
            <div className="flex items-center gap-2">
              {optional && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={saveStatus === "saving"}
                  onClick={() => void saveAndContinue({ skip: true })}
                >
                  {t("onboarding.skip")}
                </Button>
              )}
              <Button
                type="button"
                className="rounded-full font-semibold px-7 shadow-glow"
                disabled={saveStatus === "saving"}
                onClick={() => void saveAndContinue()}
              >
                {saveStatus === "saving" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : step >= ONBOARDING_STEP_COUNT ? (
                  t("onboarding.buildProfile")
                ) : (
                  t("onboarding.continue")
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </PageContent>
    </PageShell>
  );
}
