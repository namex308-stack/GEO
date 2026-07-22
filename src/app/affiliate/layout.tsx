import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.affiliate);

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
