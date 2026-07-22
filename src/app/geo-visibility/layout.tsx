import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.geoVisibility);

export default function GeoVisibilityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
