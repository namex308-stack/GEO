import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.howItWorks);

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
