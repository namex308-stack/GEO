import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { translate } from "@/lib/locale/t";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = publicPageMetadata({
  title: "مدونة التجارة الإلكترونية وGEO",
  description: translate("blog.subtitle"),
  path: ROUTES.blog,
});

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
