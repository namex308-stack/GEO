import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

/** Prefer the canonical legal URL for SEO. */
export const metadata = buildPageMetadata(PAGE_SEO.refund);

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
