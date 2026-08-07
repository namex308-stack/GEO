import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  alternates: { canonical: ROUTES.security },
};

export default function SecurityLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
