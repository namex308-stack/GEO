import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  alternates: { canonical: ROUTES.changelog },
};

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
