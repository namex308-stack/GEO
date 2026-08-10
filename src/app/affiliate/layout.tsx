import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = publicPageMetadata({
  title: "برنامج التسويق بالعمولة",
  description:
    "تفاصيل برنامج عمولة ConvAudit للمتاجر والشركاء — بما في ذلك نسبة العمولة المتكررة المعلنة في الصفحة.",
  path: ROUTES.affiliate,
});

export default function AffiliateLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
