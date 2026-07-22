import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Settings",
  description: "Manage your convaudit account settings.",
  path: "/settings",
  noIndex: true,
});

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
