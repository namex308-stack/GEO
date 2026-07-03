"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Link2, Store, Swords, ArrowLeft, ArrowRight, Sparkles, Bot } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export default function AuditNewPage() {
  const t = useT();
  const [productUrl, setProductUrl] = React.useState("");
  const [storeUrl, setStoreUrl] = React.useState("");
  const [competitorUrl, setCompetitorUrl] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const valid = (() => { try { const u = new URL(productUrl); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; } })();

  return (
    <PageShell>
      <PageHeader title={t("auditNew.title")} subtitle={t("auditNew.subtitle")} icon={Link2} back="/dashboard" />
      <PageContent className="max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
          {/* Product URL */}
          <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
            <Link2 className="size-6" />
          </div>
          <h2 className="font-display text-2xl font-bold">{t("auditNew.productUrl")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("auditNew.productUrlDesc")}</p>

          <div className="mt-6 space-y-2">
            <Label htmlFor="product">{t("auditNew.productUrl")} <span className="text-rose-500">*</span></Label>
            <Input
              id="product" type="url" inputMode="url"
              placeholder={t("auditNew.productPlaceholder")}
              value={productUrl}
              onChange={(e) => { setProductUrl(e.target.value); setTouched(false); }}
              className={cn("h-12 text-sm", touched && !valid && "border-rose-500")}
              autoFocus
            />
            {touched && !valid && <p className="text-xs text-rose-500">{t("auditNew.urlError")}</p>}
          </div>

          <div className="mt-5 rounded-lg bg-muted/50 p-3.5 flex gap-2.5">
            <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{t("auditNew.tip")}</p>
          </div>

          {/* Optional */}
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Store className="size-4" /> {t("auditNew.storeUrl")} <span className="font-normal">({t("onboarding.store.optional")})</span>
              </Label>
              <Input type="url" placeholder="https://shop.example.com" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} className="h-12 text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Swords className="size-4" /> {t("auditNew.competitorUrl")} <span className="font-normal">({t("onboarding.store.optional")})</span>
              </Label>
              <Input type="url" placeholder="https://competitor.com/products/similar" value={competitorUrl} onChange={(e) => setCompetitorUrl(e.target.value)} className="h-12 text-sm" />
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-primary/5 border border-primary/20 p-3.5 flex gap-2.5">
            <Bot className="size-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{t("auditNew.competitorTip")}</p>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" asChild className="rounded-full"><Link href="/dashboard"><ArrowLeft className="size-4 ml-1" /> {t("auditNew.cancel")}</Link></Button>
            <Button
              asChild
              disabled={!valid}
              onClick={() => { if (!valid) setTouched(true); }}
              className="rounded-full font-semibold px-7 shadow-glow disabled:opacity-40"
            >
              <Link href="/audit/demo/scanning">{t("auditNew.runAudit")} <ArrowRight className="size-4 ml-1" /></Link>
            </Button>
          </div>
        </motion.div>
      </PageContent>
    </PageShell>
  );
}
