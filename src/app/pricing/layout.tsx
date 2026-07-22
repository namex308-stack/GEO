import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.pricing);

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
