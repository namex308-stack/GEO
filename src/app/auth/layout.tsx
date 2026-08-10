import type { Metadata } from "next";
import type { ReactNode } from "react";
import { privatePageMetadata } from "@/lib/seo/private-page-metadata";

/** Sign-in entry point — no indexable content, excluded from search indexing. */
export const metadata: Metadata = privatePageMetadata();

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
