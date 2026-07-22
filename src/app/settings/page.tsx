"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings, User, CreditCard, BarChart3, Bell, Globe2, Shield, ArrowUpRight, LogOut, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { crumbsForPath } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useT } from "@/lib/i18n";
import { useLanguageStore } from "@/lib/language-store";
import { signOut } from "@/lib/auth/sign-out";
import { toast } from "sonner";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function SettingsPage() {
  const t = useT();
  const router = useRouter();
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage);
  const language = useLanguageStore((s) => s.language);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [country, setCountry] = React.useState("");

  React.useEffect(() => {
    fetch("/api/profile")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data?.profile) {
          setName(data.profile.name ?? "");
          setEmail(data.profile.email ?? "");
          setCompany(data.profile.company ?? "");
          setCountry(data.profile.country ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, country }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || t("settings.saveFailed"));
        return;
      }
      if (data.profile) {
        setName(data.profile.name ?? name);
        setCompany(data.profile.company ?? company);
        setCountry(data.profile.country ?? country);
      }
      toast.success(t("settings.saved"));
    } catch {
      toast.error(t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      setLoggingOut(false);
      toast.error("Could not sign out. Please try again.");
    }
  };

  const SECTIONS = [
    { href: "/settings/billing", icon: CreditCard, label: t("settings.billingSubscription"), desc: t("settings.billingDesc") },
    { href: "/settings/usage", icon: BarChart3, label: t("settings.usage"), desc: t("settings.usageDesc") },
  ];

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
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} icon={Settings} back="/dashboard" crumbs={crumbsForPath("/settings")} />
      <PageContent className="space-y-6 max-w-3xl">
        {/* Profile */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-5"><User className="size-5 text-primary" /> {t("settings.profile")}</h2>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="size-16">
              <AvatarFallback className="gradient-brand text-white text-xl font-bold">{initials(name || email)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{name || "—"}</div>
              <div className="text-sm text-muted-foreground">{email || "—"}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full mr-auto"
              onClick={() => toast.info(t("settings.avatarSoon"))}
            >
              {t("settings.changeAvatar")}
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm text-muted-foreground">{t("settings.fullName")}</Label>
              <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm text-muted-foreground">{t("settings.email")}</Label>
              <Input id="email" value={email} readOnly className="h-11 rounded-xl text-sm bg-muted/40" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-sm text-muted-foreground">{t("settings.company")}</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t("settings.companyPlaceholder")} className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-sm text-muted-foreground">{t("settings.country")}</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="h-11 rounded-xl text-sm" />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button className="rounded-full" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="size-4 animate-spin ml-1" /> : null}
              {t("settings.saveChanges")}
            </Button>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid sm:grid-cols-2 gap-4">
          {SECTIONS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
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

        {/* Preferences */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-5"><Bell className="size-5 text-primary" /> {t("settings.preferences")}</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-3 border-b border-border/50">
              <span className="size-9 rounded-lg bg-muted grid place-items-center text-muted-foreground"><Bell className="size-4" /></span>
              <div className="flex-1">
                <div className="text-sm font-medium">{t("settings.emailNotifs")}</div>
                <div className="text-xs text-muted-foreground">{t("settings.emailNotifsDesc")}</div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/watch">{t("settings.manage")}</Link>
              </Button>
            </div>
            <div className="flex items-center gap-3 py-3 border-b border-border/50">
              <span className="size-9 rounded-lg bg-muted grid place-items-center text-muted-foreground"><Globe2 className="size-4" /></span>
              <div className="flex-1">
                <div className="text-sm font-medium">{t("settings.language")}</div>
                <div className="text-xs text-muted-foreground">
                  {language === "ar" ? "العربية (RTL)" : "English (LTR)"}
                </div>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" onClick={toggleLanguage}>
                {language === "en" ? "العربية" : "English"}
              </Button>
            </div>
            <div className="flex items-center gap-3 py-3">
              <span className="size-9 rounded-lg bg-muted grid place-items-center text-muted-foreground"><Shield className="size-4" /></span>
              <div className="flex-1">
                <div className="text-sm font-medium">{t("settings.twoFactor")}</div>
                <div className="text-xs text-muted-foreground">{t("settings.twoFactorDesc")}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => toast.info(t("settings.twoFactorSoon"))}
              >
                {t("settings.edit")}
              </Button>
            </div>
          </div>
        </div>

        {/* Log out */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="size-10 rounded-xl bg-rose-500/10 text-rose-500 grid place-items-center">
              <LogOut className="size-5" />
            </span>
            <div className="flex-1">
              <div className="font-semibold text-sm">{t("settings.logout")}</div>
              <div className="text-xs text-muted-foreground">{t("settings.logoutDesc")}</div>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? <Loader2 className="size-4 animate-spin ml-1" /> : <LogOut className="size-4 ml-1" />}
              {t("settings.logout")}
            </Button>
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
