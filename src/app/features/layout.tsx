import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.features);

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
