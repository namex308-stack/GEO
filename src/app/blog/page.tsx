import type { Metadata } from "next";
import { BlogListing } from "@/components/blog/blog-listing";
import { buildBlogListingMetadata } from "@/lib/blog/seo";

export const metadata: Metadata = buildBlogListingMetadata();

export default function BlogPage() {
  return <BlogListing />;
}
