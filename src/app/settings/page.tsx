"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  Store,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { getUserInitials } from "@/lib/auth/display-user";
import { useT } from "@/lib/i18n";
import { normalizeAppLocale } from "@/lib/locale";
import { getEnabledLocales } from "@/lib/locale/config";
import {
  CATEGORY_OPTIONS,
  CHALLENGE_OPTIONS,
  COUNTRY_OPTIONS,
  GOAL_OPTIONS,
  LANGUAGE_OPTIONS,
  ORDERS_OPTIONS,
  PLATFORM_OPTIONS,
  STORE_SIZE_OPTIONS,
  TRAFFIC_OPTIONS,
} from "@/lib/onboarding/constants";

type BizForm = {
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
};

const EMPTY_FORM: BizForm = {
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
};

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  const t = useT();
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
      >
        <option value="">{t("settings.selectPlaceholder")}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SettingsPage() {
  const t = useT();
  const { user } = useAuth();
  const authInitials = user ? getUserInitials(user) : "?";
  const enabledLocales = getEnabledLocales();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [locale, setLocale] = React.useState(normalizeAppLocale("ar"));
  const [timezone, setTimezone] = React.useState("");
  const [loadingAccount, setLoadingAccount] = React.useState(true);
  const [savingAccount, setSavingAccount] = React.useState(false);
  const [savedAccount, setSavedAccount] = React.useState(false);

  const [biz, setBiz] = React.useState<BizForm>(EMPTY_FORM);
  const [loadingBiz, setLoadingBiz] = React.useState(true);
  const [savingBiz, setSavingBiz] = React.useState(false);
  const [savedBiz, setSavedBiz] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileRes, onboardingRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/onboarding"),
        ]);

        if (profileRes.ok) {
          const data = (await profileRes.json()) as {
            profile?: {
              fullName?: string;
              email?: string;
              locale?: string;
              timezone?: string;
            };
          };
          if (!cancelled && data.profile) {
            setFullName(data.profile.fullName || "");
            setEmail(data.profile.email || user?.email || "");
            setLocale(normalizeAppLocale(data.profile.locale || "ar"));
            setTimezone(data.profile.timezone || "");
          }
        }

        if (onboardingRes.ok) {
          const data = (await onboardingRes.json()) as { onboarding?: Partial<BizForm> };
          if (!cancelled && data.onboarding) {
            setBiz({
              businessName: data.onboarding.businessName || "",
              storeUrl: data.onboarding.storeUrl || "",
              country: data.onboarding.country || "",
              primaryLanguage: data.onboarding.primaryLanguage || "",
              platform: data.onboarding.platform || "",
              storeSize: data.onboarding.storeSize || "",
              businessCategory: data.onboarding.businessCategory || "",
              primaryGoal: data.onboarding.primaryGoal || "",
              monthlyTraffic: data.onboarding.monthlyTraffic || "",
              monthlyOrders: data.onboarding.monthlyOrders || "",
              mainChallenge: data.onboarding.mainChallenge || "",
              competitorUrl: data.onboarding.competitorUrl || "",
            });
          }
        }
      } finally {
        if (!cancelled) {
          setLoadingAccount(false);
          setLoadingBiz(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const setBizField = <K extends keyof BizForm>(key: K, value: BizForm[K]) => {
    setBiz((prev) => ({ ...prev, [key]: value }));
    setSavedBiz(false);
  };

  const saveAccount = async () => {
    setSavingAccount(true);
    setSavedAccount(false);
    try {
      const nextLocale = normalizeAppLocale(locale);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          locale: nextLocale,
          timezone,
          businessName: biz.businessName,
          country: biz.country,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error || t("settings.saveProfileError"));
        return;
      }
      const data = (await res.json()) as { profile?: { fullName?: string; email?: string } };
      if (data.profile?.fullName != null) setFullName(data.profile.fullName);
      if (data.profile?.email) setEmail(data.profile.email);
      setSavedAccount(true);
      toast.success(t("settings.saved"));
    } catch {
      toast.error(t("settings.networkError"));
    } finally {
      setSavingAccount(false);
    }
  };

  const saveBusinessProfile = async () => {
    setSavingBiz(true);
    setSavedBiz(false);
    try {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "settings", answers: biz }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error || t("settings.saveBusinessError"));
        return;
      }
      setSavedBiz(true);
      toast.success(t("settings.saved"));
    } catch {
      toast.error(t("settings.saveBusinessError"));
    } finally {
      setSavingBiz(false);
    }
  };

  const initials = fullName
    ? fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("") || authInitials
    : authInitials;

  const SECTIONS = [
    { href: "/settings/billing", icon: CreditCard, label: t("settings.billingSubscription"), desc: t("settings.billingDesc") },
    { href: "/settings/usage", icon: BarChart3, label: t("settings.usage"), desc: t("settings.usageDesc") },
  ];

  return (
    <PageShell>
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} icon={Settings} back="/dashboard" />
      <PageContent className="space-y-6 max-w-3xl">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <User className="size-5 text-primary" /> {t("settings.profile")}
            </h2>
            {savedAccount && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="size-3.5" /> {t("settings.saved")}
              </span>
            )}
          </div>
          {loadingAccount ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="size-16">
                  <AvatarFallback className="gradient-brand text-white text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{fullName || "—"}</div>
                  <div className="text-sm text-muted-foreground">{email || "—"}</div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">{t("settings.fullName")}</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setSavedAccount(false);
                    }}
                    className="h-11 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">{t("settings.email")}</Label>
                  <Input value={email} readOnly className="h-11 rounded-xl text-sm bg-muted/40" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">{t("settings.localeLabel")}</Label>
                  <select
                    value={locale}
                    onChange={(e) => {
                      setLocale(normalizeAppLocale(e.target.value));
                      setSavedAccount(false);
                    }}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  >
                    {enabledLocales.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">{t("settings.timezone")}</Label>
                  <Input
                    value={timezone}
                    onChange={(e) => {
                      setTimezone(e.target.value);
                      setSavedAccount(false);
                    }}
                    placeholder="Africa/Cairo"
                    className="h-11 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button
                  className="rounded-full"
                  disabled={savingAccount}
                  onClick={() => void saveAccount()}
                >
                  {savingAccount ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    t("settings.saveChanges")
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Store className="size-5 text-primary" /> {t("settings.businessProfile")}
            </h2>
            {savedBiz && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="size-3.5" /> {t("settings.saved")}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            {t("settings.businessProfileDesc")}
          </p>
          {loadingBiz ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">{t("settings.businessName")}</Label>
                  <Input
                    value={biz.businessName}
                    onChange={(e) => setBizField("businessName", e.target.value)}
                    className="h-11 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">{t("onboarding.store.url")}</Label>
                  <Input
                    value={biz.storeUrl}
                    onChange={(e) => setBizField("storeUrl", e.target.value)}
                    className="h-11 rounded-xl text-sm"
                  />
                </div>
                <SelectField
                  label={t("settings.country")}
                  value={biz.country}
                  onChange={(v) => setBizField("country", v)}
                  options={COUNTRY_OPTIONS}
                />
                <SelectField
                  label={t("settings.primaryLanguage")}
                  value={biz.primaryLanguage}
                  onChange={(v) => setBizField("primaryLanguage", v)}
                  options={LANGUAGE_OPTIONS}
                />
                <SelectField
                  label={t("settings.platform")}
                  value={biz.platform}
                  onChange={(v) => setBizField("platform", v)}
                  options={PLATFORM_OPTIONS}
                />
                <SelectField
                  label={t("settings.storeSize")}
                  value={biz.storeSize}
                  onChange={(v) => setBizField("storeSize", v)}
                  options={STORE_SIZE_OPTIONS}
                />
                <SelectField
                  label={t("settings.category")}
                  value={biz.businessCategory}
                  onChange={(v) => setBizField("businessCategory", v)}
                  options={CATEGORY_OPTIONS}
                />
                <SelectField
                  label={t("settings.primaryGoalLabel")}
                  value={biz.primaryGoal}
                  onChange={(v) => setBizField("primaryGoal", v)}
                  options={GOAL_OPTIONS}
                />
                <SelectField
                  label={t("settings.monthlyTraffic")}
                  value={biz.monthlyTraffic}
                  onChange={(v) => setBizField("monthlyTraffic", v)}
                  options={TRAFFIC_OPTIONS}
                />
                <SelectField
                  label={t("settings.monthlyOrders")}
                  value={biz.monthlyOrders}
                  onChange={(v) => setBizField("monthlyOrders", v)}
                  options={ORDERS_OPTIONS}
                />
                <SelectField
                  label={t("settings.mainChallenge")}
                  value={biz.mainChallenge}
                  onChange={(v) => setBizField("mainChallenge", v)}
                  options={CHALLENGE_OPTIONS}
                />
                <div className="space-y-1.5">
                  <Label className="text-sm text-muted-foreground">{t("auditNew.competitorUrl")}</Label>
                  <Input
                    value={biz.competitorUrl}
                    onChange={(e) => setBizField("competitorUrl", e.target.value)}
                    className="h-11 rounded-xl text-sm"
                    placeholder="https://competitor.com"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button
                  className="rounded-full"
                  disabled={savingBiz}
                  onClick={() => void saveBusinessProfile()}
                >
                  {savingBiz ? <Loader2 className="size-4 animate-spin" /> : t("settings.saveChanges")}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {SECTIONS.map((s, i) => (
            <motion.div key={s.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link href={s.href} className="block rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <span className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><s.icon className="size-5" /></span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </PageContent>
    </PageShell>
  );
}
