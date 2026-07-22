import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Audit",
  description: "Run and view convaudit product page audits.",
  path: "/audit",
  noIndex: true,
});

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
