import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.privacy);

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
