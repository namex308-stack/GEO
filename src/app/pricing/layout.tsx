import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { translate } from "@/lib/locale/t";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = publicPageMetadata({
  title: "أسعار الباقات",
  description: translate("pricing.subtitle"),
  path: ROUTES.pricing,
});

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
