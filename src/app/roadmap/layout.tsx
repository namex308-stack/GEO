import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = publicPageMetadata({
  title: "خارطة طريق المنتج",
  description:
    "أولويات توجيهية معلنة للمنتج — ليست تعهدات تعاقدية ولا مواعيد تسليم ملزمة.",
  path: ROUTES.roadmap,
});

export default function RoadmapLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
