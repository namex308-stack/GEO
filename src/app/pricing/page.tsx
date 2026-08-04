"use client";

import { Zap } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Pricing } from "@/components/sections/pricing";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useT } from "@/lib/i18n";

export default function PricingPage() {
  const t = useT();
  const { startAuditAndNavigate } = useNavigateAfterAction();

  return (
    <PageShell>
      <PageHeader title={t("pricing.title")} subtitle={t("pricing.subtitle")} icon={Zap} />
      <PageContent>
        <Pricing onFreeCta={startAuditAndNavigate} variant="page" />
      </PageContent>
    </PageShell>
  );
}
