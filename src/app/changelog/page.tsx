"use client";

import { GitBranch } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { SurfaceCard } from "@/components/design-system/section";

export default function ChangelogPage() {
  return (
    <PageShell>
      <PageHeader
        title="سجل التحديثات"
        subtitle="ستُنشر هنا تحديثات المنتج مع كل إصدار."
        icon={GitBranch}
      />
      <PageContent className="max-w-2xl">
        <SurfaceCard className="p-8 text-center">
          <p className="text-sm font-semibold">لا توجد إصدارات عامة مُدرجة حتى الآن</p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            هذا نص مؤقت جاهز للإنتاج. عند نشر تحديثات مُرقّمة، ستشمل السجلات التاريخ والنطاق وملاحظات
            الترحيل عند الحاجة.
          </p>
        </SurfaceCard>
      </PageContent>
    </PageShell>
  );
}
