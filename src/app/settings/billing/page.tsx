"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Crown, Check, Calendar, Loader2, ShieldCheck } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { crumbsForPath } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { getPlanLimits, isUnlimitedAudits } from "@/lib/billing/entitlements";
import { resolveEffectivePlan } from "@/lib/billing/dev-unlock";
import { toast } from "sonner";
import type { Profile, UsageCounter, Subscription } from "@/lib/database.types";
import type { PlanId } from "@/lib/billing/plans";

export default function BillingPage() {
  const t = useT();
  const searchParams = useSearchParams();
  const sb = React.useMemo(() => getSupabaseBrowser(), []);
  const [loading, setLoading] = React.useState(!!sb);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [usage, setUsage] = React.useState<UsageCounter | null>(null);
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const upgraded = searchParams.get("upgraded");

    async function fetchBilling() {
      try {
        const res = await fetch("/api/billing");
        if (!res.ok) {
          // Fall back to direct Supabase reads
          if (!sb) {
            if (!cancelled) setLoading(false);
            return;
          }
          const { data: { user } } = await sb.auth.getUser();
          if (cancelled || !user) {
            if (!cancelled) setLoading(false);
            return;
          }
          const [profileRes, usageRes, subRes] = await Promise.all([
            sb.from("profiles").select("*").eq("id", user.id).single(),
            sb.from("usage_counters").select("*").eq("user_id", user.id)
              .eq("month", new Date().toISOString().slice(0, 7))
              .maybeSingle(),
            sb.from("subscriptions").select("*").eq("user_id", user.id)
              .order("created_at", { ascending: false }).limit(1).maybeSingle(),
          ]);
          if (cancelled) return;
          const fallbackProfile = profileRes.data as Profile | null;
          if (fallbackProfile) {
            setProfile({
              ...fallbackProfile,
              plan: resolveEffectivePlan(fallbackProfile.plan as PlanId),
            });
          } else {
            setProfile(null);
          }
          setUsage(usageRes.data as UsageCounter | null);
          setSubscription(subRes.data as Subscription | null);
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        setProfile({
          id: "",
          name: null,
          email: null,
          plan: data.plan,
          kashier_customer_id: null,
          onboarding: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Profile);

        setUsage({
          user_id: "",
          month: new Date().toISOString().slice(0, 7),
          audits_used: data.auditsUsed ?? 0,
          generations_used: data.generationsUsed ?? 0,
        });

        if (data.currentPeriodEnd || data.subscriptionStatus) {
          setSubscription({
            id: "",
            user_id: "",
            plan_id: data.plan,
            status: data.subscriptionStatus ?? "active",
            billing_period: data.billingPeriod ?? null,
            kashier_subscription_id: null,
            current_period_start: null,
            current_period_end: data.currentPeriodEnd,
            created_at: new Date().toISOString(),
          } as Subscription);
        }

        // Enrich with full profile/subscription from Supabase when available
        if (sb) {
          const { data: { user } } = await sb.auth.getUser();
          if (user && !cancelled) {
            const [profileRes, subRes] = await Promise.all([
              sb.from("profiles").select("*").eq("id", user.id).single(),
              sb.from("subscriptions").select("*").eq("user_id", user.id)
                .order("created_at", { ascending: false }).limit(1).maybeSingle(),
            ]);
            if (profileRes.data) {
              const p = profileRes.data as Profile;
              setProfile({
                ...p,
                plan: resolveEffectivePlan(p.plan as PlanId),
              });
            }
            if (subRes.data) setSubscription(subRes.data as Subscription);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (upgraded) {
        toast.success(t("billing.upgradeSuccess", { plan: upgraded.toUpperCase() }));
      }
    }

    void fetchBilling();

    return () => {
      cancelled = true;
    };
  }, [sb, searchParams, t]);

  const plan = resolveEffectivePlan(profile?.plan ?? "free");
  const limits = getPlanLimits(plan);
  const auditsUsed = usage?.audits_used ?? 0;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en", { month: "long", year: "numeric" })
    : "—";
  const renewDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en", { month: "long", day: "numeric" })
    : "—";

  const planLabel = plan === "business" ? "Business" : plan === "pro" ? "Pro" : "Free";
  const auditLimitDisplay = isUnlimitedAudits(plan) ? "∞" : limits.auditsPerMonth;

  if (loading) {
    return (
      <PageShell>
        <PageContent className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </PageContent>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader title={t("billing.title")} subtitle={t("billing.subtitle")} icon={CreditCard} back="/settings" crumbs={crumbsForPath("/settings/billing")} />
      <PageContent className="space-y-6 max-w-3xl">
        {/* Current plan */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display text-xl font-bold">{planLabel}</h2>
                <Badge className="rounded-full gradient-brand text-white">{plan}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan === "business"
                  ? t("billing.businessDesc")
                  : plan === "pro"
                    ? t("billing.proDesc")
                    : t("billing.freeDesc")}
              </p>
            </div>
            {plan !== "business" && (
              <Button asChild className="rounded-full shadow-glow">
                <Link href="/pricing"><Crown className="size-4 ml-1 text-brand" /> {t("dashboard.upgrade")}</Link>
              </Button>
            )}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">{t("billing.auditsRemaining")}</div>
              <div className="font-display text-xl font-bold mt-1">{auditsUsed} / {auditLimitDisplay}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("billing.renewsOn")}</div>
              <div className="font-display text-xl font-bold mt-1">{renewDate}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("billing.memberSince")}</div>
              <div className="font-display text-xl font-bold mt-1">{memberSince}</div>
            </div>
          </div>
        </motion.div>

        {/* Payment method */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-bold mb-4">{t("billing.paymentMethod")}</h2>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/20">
            <span className="size-10 rounded-lg bg-background grid place-items-center text-muted-foreground"><CreditCard className="size-5" /></span>
            <div className="flex-1">
              {subscription?.kashier_subscription_id ? (
                <>
                  <div className="text-sm font-medium flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-primary" /> Kashier
                  </div>
                  <div className="text-xs text-muted-foreground">{t("landingPricing.paymentMethods")}</div>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium">{t("billing.noPayment")}</div>
                  <div className="text-xs text-muted-foreground">{t("billing.noPaymentDesc")}</div>
                </>
              )}
            </div>
            {plan === "free" && (
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/pricing">{t("billing.addCard")}</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Subscription info */}
        {subscription && (
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/60">
              <h2 className="font-display text-lg font-bold">{t("billing.invoices")}</h2>
            </div>
            <div className="px-6 py-4 flex items-center gap-4">
              <span className="size-9 rounded-lg bg-muted grid place-items-center text-muted-foreground"><Calendar className="size-4" /></span>
              <div className="flex-1">
                <div className="text-sm font-medium capitalize">
                  {subscription.plan_id}
                  {subscription.billing_period ? ` · ${subscription.billing_period}` : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  {subscription.current_period_start && new Date(subscription.current_period_start).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
                  {subscription.current_period_end
                    ? ` → ${new Date(subscription.current_period_end).toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}`
                    : ""}
                </div>
              </div>
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs capitalize">
                <Check className="size-3 ml-1" /> {subscription.status}
              </Badge>
            </div>
          </div>
        )}
      </PageContent>
    </PageShell>
  );
}
