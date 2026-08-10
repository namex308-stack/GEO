import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { ROUTES } from "@/lib/routes";

/** Placeholder until live monitoring ships — keep out of the index. */
export const metadata: Metadata = publicPageMetadata({
  title: "حالة النظام",
  description:
    "صفحة حالة عامة قيد الإعداد. لا نعرض نسب توفّر غير حقيقية قبل ربط مراقبة فعلية.",
  path: ROUTES.status,
  indexable: false,
});

export default function StatusLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
