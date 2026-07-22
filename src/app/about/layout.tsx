import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.about);

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
