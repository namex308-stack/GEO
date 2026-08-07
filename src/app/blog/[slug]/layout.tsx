import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { translate } from "@/lib/locale/t";
import { ROUTES } from "@/lib/routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  // Unknown slugs 404 in the page itself; leave metadata to the parent /blog default.
  if (!post) return {};

  const title = translate(post.titleKey);
  const description = translate(post.excerptKey);
  const url = ROUTES.blogPost(slug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "ConvAudit",
      locale: "ar_EG",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function BlogPostLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
