"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, Crown, Check, Download, Calendar } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";

export default function BillingPage() {
  const t = useT();

  const INVOICES = [
    { id: "INV-003", date: "1 أكتوبر 2026", amount: "$29.00", status: t("billing.paid") },
    { id: "INV-002", date: "1 سبتمبر 2026", amount: "$29.00", status: t("billing.paid") },
    { id: "INV-001", date: "1 أغسطس 2026", amount: "$29.00", status: t("billing.paid") },
  ];

  return (
    <PageShell>
      <PageHeader title={t("billing.title")} subtitle={t("billing.subtitle")} icon={CreditCard} back="/settings" />
      <PageContent className="space-y-6 max-w-3xl">
        {/* Current plan */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display text-xl font-bold">{t("billing.freePlan")}</h2>
                <Badge className="rounded-full gradient-brand text-white">{t("pricing.free")}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{t("billing.freeDesc")}</p>
            </div>
            <Button asChild className="rounded-full shadow-glow"><Link href="/pricing"><Crown className="size-4 ml-1 text-brand" /> {t("dashboard.upgrade")}</Link></Button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div><div className="text-xs text-muted-foreground">{t("billing.auditsRemaining")}</div><div className="font-display text-xl font-bold mt-1">2 / 3</div></div>
            <div><div className="text-xs text-muted-foreground">{t("billing.renewsOn")}</div><div className="font-display text-xl font-bold mt-1">1 نوفمبر</div></div>
            <div><div className="text-xs text-muted-foreground">{t("billing.memberSince")}</div><div className="font-display text-xl font-bold mt-1">أغسطس 2026</div></div>
          </div>
        </motion.div>

        {/* Payment method */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-bold mb-4">{t("billing.paymentMethod")}</h2>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/20">
            <span className="size-10 rounded-lg bg-background grid place-items-center text-muted-foreground"><CreditCard className="size-5" /></span>
            <div className="flex-1"><div className="text-sm font-medium">{t("billing.noPayment")}</div><div className="text-xs text-muted-foreground">{t("billing.noPaymentDesc")}</div></div>
            <Button variant="outline" size="sm" className="rounded-full">{t("billing.addCard")}</Button>
          </div>
        </div>

        {/* Invoices */}
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60"><h2 className="font-display text-lg font-bold">{t("billing.invoices")}</h2></div>
          <div className="divide-y divide-border/50">
            {INVOICES.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-4">
                <span className="size-9 rounded-lg bg-muted grid place-items-center text-muted-foreground"><Calendar className="size-4" /></span>
                <div className="flex-1"><div className="text-sm font-medium">{inv.id}</div><div className="text-xs text-muted-foreground">{inv.date}</div></div>
                <div className="text-sm font-semibold">{inv.amount}</div>
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 text-xs"><Check className="size-3 ml-1" /> {inv.status}</Badge>
                <Button variant="ghost" size="icon" className="size-8 rounded-full"><Download className="size-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
