import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo/private-page-metadata";

/** Signed-in app surface — excluded from search indexing (paired with robots.ts disallow). */
export const metadata: Metadata = privatePageMetadata();

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
