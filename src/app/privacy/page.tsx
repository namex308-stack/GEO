"use client";

import { Lock } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { SurfaceCard } from "@/components/design-system/section";

export default function PrivacyPage() {
  return (
    <PageShell>
      <PageHeader
        title="الخصوصية"
        subtitle="ما نجمعه، لماذا نجمعه، وكيف تطلب حذفه."
        icon={Lock}
      />
      <PageContent className="max-w-3xl space-y-4">
        {[
          {
            t: "بيانات الحساب",
            b: "عند إنشاء حساب، نخزّن معرّفات المصادقة وحقول الملف الشخصي اللازمة لتشغيل المنتج.",
          },
          {
            t: "مدخلات التحليل",
            b: "روابط المنتجات التي تُرسلها تُعالَج لإنشاء التقارير. قد يتم جلب محتوى الصفحة عبر مزودي استخراج مُهيَّئين عند تفعيلهم.",
          },
          {
            t: "معالجات اختيارية",
            b: "مزودو الذكاء الاصطناعي، تسجيل الدخول، الدفع، وتحديد المعدل يُستخدمون فقط عند ضبطهم. بدون هذه المفاتيح، يعمل التطبيق في وضع العرض التجريبي بمخرجات نموذجية.",
          },
          {
            t: "الاحتفاظ والحذف",
            b: "تُحفظ نتائج التحليل لضمان عمل المنتج. تواصل مع الدعم لطلب حذف البيانات المرتبطة بحسابك.",
          },
        ].map((item) => (
          <SurfaceCard key={item.t} className="p-5">
            <h2 className="font-display font-semibold text-sm">{item.t}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.b}</p>
          </SurfaceCard>
        ))}
        <p className="text-xs text-muted-foreground pt-2">
          هذه الصفحة نظرة عامة على المنتج، ولا تُعد بديلاً عن سياسة قانونية خاصة بكل نطاق قضائي. ستحل سياسة خصوصية
          قانونية كاملة محل هذا النص المؤقت قبل الإطلاق الفعلي للمنتج.
        </p>
      </PageContent>
    </PageShell>
  );
}
