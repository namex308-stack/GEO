import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata = buildPageMetadata(PAGE_SEO.contact);

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
