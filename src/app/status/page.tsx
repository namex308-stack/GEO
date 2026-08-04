"use client";

import { Activity } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { SurfaceCard } from "@/components/design-system/section";

export default function StatusPage() {
  return (
    <PageShell>
      <PageHeader
        title="حالة النظام"
        subtitle="ستظهر هنا مراقبة توفّر الخدمة العامة."
        icon={Activity}
      />
      <PageContent className="max-w-2xl space-y-4">
        <SurfaceCard className="p-6">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-muted-foreground/40" aria-hidden />
            <h2 className="font-display font-semibold text-sm">مراقبة الحالة غير مفعّلة بعد</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            لا نعرض نسب توفّر خدمة غير حقيقية. عند ربط مزود مراقبة، ستُظهر هذه الصفحة حالة تطبيق الويب، وواجهة
            التحليل البرمجية، والتكاملات الاختيارية.
          </p>
        </SurfaceCard>
        <SurfaceCard className="p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">المكوّنات المخطط لها</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>تطبيق الويب</li>
            <li>واجهة التحليل البرمجية</li>
            <li>تسجيل الدخول (عند تفعيله)</li>
            <li>مزودو الذكاء الاصطناعي والاستخراج (عند تفعيلهم)</li>
          </ul>
        </SurfaceCard>
      </PageContent>
    </PageShell>
  );
}
