import type { Metadata } from "next";
import { RefundPolicyPage } from "@/components/marketing/refund-policy-page";
import { buildPageMetadata, PAGE_SEO } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata(PAGE_SEO.refund);

export default function LegalRefundPolicyPage() {
  return <RefundPolicyPage />;
}
