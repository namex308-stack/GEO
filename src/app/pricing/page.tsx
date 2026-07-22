"use client";

import { Zap } from "lucide-react";
import { PageHeader, PageContent } from "@/components/app/page-shell";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PricingSection } from "@/components/PricingSection";
import { PlanComparisonTable } from "@/components/sections/plan-comparison-table";
import { PricingFAQ } from "@/components/sections/pricing-faq";
import { useT } from "@/lib/i18n";

export default function PricingPage() {
  const t = useT();

  return (
    <MarketingShell>
      <PageHeader title={t("pricing.title")} subtitle={t("pricing.subtitle")} icon={Zap} />
      <PageContent>
        <div className="text-center max-w-2xl mx-auto">
          <PricingSection />
        </div>
        <PlanComparisonTable />
        <PricingFAQ />
      </PageContent>
    </MarketingShell>
  );
}
