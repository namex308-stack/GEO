import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { translate } from "@/lib/locale/t";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = publicPageMetadata({
  title: "التوثيق ودليل البدء",
  description: translate("docs.subtitle"),
  path: ROUTES.docs,
});

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
