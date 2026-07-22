import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.aiGenerator);

export default function AiGeneratorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
