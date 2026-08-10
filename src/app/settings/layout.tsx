import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo/private-page-metadata";

/**
 * Signed-in settings (includes `/settings/billing` and `/settings/usage`).
 * Excluded from search indexing (paired with robots.ts disallow).
 */
export const metadata: Metadata = privatePageMetadata();

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
