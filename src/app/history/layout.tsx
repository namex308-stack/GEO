import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Audit History",
  description: "View your past convaudit reports.",
  path: "/history",
  noIndex: true,
});

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
