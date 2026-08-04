"use client";

import { Map } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { SurfaceCard } from "@/components/design-system/section";

const ITEMS = [
  { status: "الآن", title: "وثائق تقييم شفافة", note: "منهجية التحليل وحقول التقرير على الصفحة التسويقية." },
  { status: "التالي", title: "قصص عملاء موثّقة", note: "دراسات حالة بأسماء العملاء فقط بعد موافقتهم." },
  { status: "لاحقاً", title: "صفحة حالة عامة", note: "إشارات توفّر آلية للواجهات البرمجية الأساسية." },
] as const;

export default function RoadmapPage() {
  return (
    <PageShell>
      <PageHeader
        title="خارطة الطريق"
        subtitle="أولويات توجيهية — ليست تعهدات أو مواعيد تسليم."
        icon={Map}
      />
      <PageContent className="max-w-2xl space-y-3">
        {ITEMS.map((item) => (
          <SurfaceCard key={item.title} className="p-5 flex gap-4 items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md shrink-0">
              {item.status}
            </span>
            <div>
              <h2 className="font-display font-semibold text-sm">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.note}</p>
            </div>
          </SurfaceCard>
        ))}
      </PageContent>
    </PageShell>
  );
}
