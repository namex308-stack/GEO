import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Signed-in app surface — excluded from search indexing (paired with robots.ts disallow). */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
