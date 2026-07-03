"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Settings, User, CreditCard, BarChart3, Bell, Globe2, Shield, ArrowUpRight } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useT } from "@/lib/i18n";

export default function SettingsPage() {
  const t = useT();

  const SECTIONS = [
    { href: "/settings/billing", icon: CreditCard, label: t("settings.billingSubscription"), desc: t("settings.billingDesc") },
    { href: "/settings/usage", icon: BarChart3, label: t("settings.usage"), desc: t("settings.usageDesc") },
  ];

  const PREFERENCES = [
    { icon: Bell, label: t("settings.emailNotifs"), desc: t("settings.emailNotifsDesc") },
    { icon: Globe2, label: t("settings.language"), desc: t("settings.languageDesc") },
    { icon: Shield, label: t("settings.twoFactor"), desc: t("settings.twoFactorDesc") },
  ];

  return (
    <PageShell>
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} icon={Settings} back="/dashboard" />
      <PageContent className="space-y-6 max-w-3xl">
        {/* Profile */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-5"><User className="size-5 text-primary" /> {t("settings.profile")}</h2>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="size-16"><AvatarFallback className="gradient-brand text-white text-xl font-bold">YE</AvatarFallback></Avatar>
            <div>
              <div className="font-semibold">Youssef El-Sayed</div>
              <div className="text-sm text-muted-foreground">youssef@storeaudit.ai</div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full mr-auto">{t("settings.changeAvatar")}</Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">{t("settings.fullName")}</Label>
              <Input defaultValue="Youssef El-Sayed" className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">{t("settings.email")}</Label>
              <Input defaultValue="youssef@storeaudit.ai" className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">{t("settings.company")}</Label>
              <Input placeholder={t("settings.companyPlaceholder")} className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">{t("settings.country")}</Label>
              <Input defaultValue="مصر" className="h-11 rounded-xl text-sm" />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button className="rounded-full">{t("settings.saveChanges")}</Button>
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
            {PREFERENCES.map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                <span className="size-9 rounded-lg bg-muted grid place-items-center text-muted-foreground"><p.icon className="size-4" /></span>
                <div className="flex-1"><div className="text-sm font-medium">{p.label}</div><div className="text-xs text-muted-foreground">{p.desc}</div></div>
                <Button variant="outline" size="sm" className="rounded-full">{t("settings.edit")}</Button>
              </div>
            ))}
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
