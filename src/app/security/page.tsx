"use client";

import Link from "next/link";
import { Shield, Server, FileCheck2, Lock } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { SurfaceCard } from "@/components/design-system/section";

const PRACTICES = [
  {
    title: "تحليل الصفحات العامة فقط",
    body: "يحلّل ConvAudit صفحات المنتجات المتاحة للعامة فقط. لا نطلب بيانات دخول لوحة تحكم المتجر.",
  },
  {
    title: "أمان النقل",
    body: "تُنقل بيانات التطبيق عبر HTTPS/TLS. مفاتيح API والأسرار تُضبط عبر متغيرات بيئة الخادم.",
  },
  {
    title: "انضباط الوصول",
    body: "يتبع الوصول التشغيلي مبدأ الحد الأدنى من الصلاحيات. إجراءات الحساب قابلة للتتبع عبر سجلات المنتج حيثما تم تفعيلها.",
  },
  {
    title: "حدود مزودي الخدمة",
    body: "التكاملات الاختيارية (الذكاء الاصطناعي، الاستخراج، الدفع، تسجيل الدخول) تُفعّل فقط عند ضبطها. يعمل وضع العرض التجريبي بدون هذه المفاتيح.",
  },
] as const;

export default function SecurityPage() {
  return (
    <PageShell>
      <PageHeader
        title="الأمان"
        subtitle="نهجنا الحالي في أمان المنتج — دون الادعاء بشهادات غير موثّقة."
        icon={Shield}
      />
      <PageContent className="space-y-10 max-w-3xl">
        <section className="grid sm:grid-cols-2 gap-4">
          {PRACTICES.map((p) => (
            <SurfaceCard key={p.title} className="p-5">
              <h2 className="font-display font-semibold text-sm">{p.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.body}</p>
            </SurfaceCard>
          ))}
        </section>

        <section id="infrastructure" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-3">
            <span className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <Server className="size-5" />
            </span>
            <h2 className="font-display text-xl font-semibold">البنية التحتية</h2>
          </div>
          <SurfaceCard className="p-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              يعمل التطبيق على استضافة سحابية معيارية لتطبيقات Next.js. الإعدادات الحساسة مضبوطة على مستوى البيئة.
              سننشر مخطط بنية أكثر تفصيلاً وقائمة مزودي الخدمة الفرعيين مع استقرار البنية الإنتاجية.
            </p>
          </SurfaceCard>
        </section>

        <section id="compliance" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-3">
            <span className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center">
              <FileCheck2 className="size-5" />
            </span>
            <h2 className="font-display text-xl font-semibold">الامتثال</h2>
          </div>
          <SurfaceCard className="p-6 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              نصمم منتجنا وفق توقعات الخصوصية الشائعة (تحديد واضح للغرض، طلبات حذف، وجمع بيانات محدود).
              الشهادات الرسمية مثل SOC 2 ستُذكر هنا فقط بعد التحقق المستقل منها.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed inline-flex items-start gap-2">
              <Lock className="size-4 mt-0.5 shrink-0 text-primary" />
              للمراجعات الأمنية أو تقارير الثغرات، تواصل معنا عبر القنوات المذكورة في الوثائق.
            </p>
            <Link href="/privacy" className="text-sm font-medium text-primary hover:underline">
              اقرأ نظرة عامة على الخصوصية ←
            </Link>
          </SurfaceCard>
        </section>
      </PageContent>
    </PageShell>
  );
}
