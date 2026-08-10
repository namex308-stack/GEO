import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { ROUTES } from "@/lib/routes";

/** Empty changelog shell — keep out of the index until versioned releases exist. */
export const metadata: Metadata = publicPageMetadata({
  title: "سجل التحديثات",
  description:
    "ستُدرج هنا ملاحظات الإصدارات العامة عند نشر تحديثات مُرقّمة. لا إصدارات مدرجة حالياً.",
  path: ROUTES.changelog,
  indexable: false,
});

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
