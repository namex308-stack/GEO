import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.docs);

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
