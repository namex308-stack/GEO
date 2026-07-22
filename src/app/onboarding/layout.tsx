import type { Metadata } from "next";
import { AuthShell } from "@/components/app/page-shell";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Onboarding",
  description: "Set up your convaudit account and run your first product page audit.",
  path: "/onboarding",
  noIndex: true,
});

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
