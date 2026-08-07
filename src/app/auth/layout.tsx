import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Sign-in entry point — no indexable content, excluded from search indexing. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
