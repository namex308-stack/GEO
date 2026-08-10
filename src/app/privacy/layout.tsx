import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = publicPageMetadata({
  title: "سياسة الخصوصية",
  description:
    "ما نجمعه لتشغيل الحسابات والتحليلات، لماذا نجمعه، وكيف تطلب حذف البيانات المرتبطة بحسابك.",
  path: ROUTES.privacy,
});

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
