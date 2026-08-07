import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  alternates: { canonical: ROUTES.privacy },
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
