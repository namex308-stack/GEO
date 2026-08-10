import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = publicPageMetadata({
  title: "أمان المنتج والبيانات",
  description:
    "نهجنا الحالي في أمان المنتج: تحليل الصفحات العامة فقط، النقل عبر HTTPS، وحدّ أدنى من الصلاحيات — دون الادعاء بشهادات غير موثّقة.",
  path: ROUTES.security,
});

export default function SecurityLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
