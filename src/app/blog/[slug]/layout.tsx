import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { getBlogPostMeta } from "@/lib/blog-posts";
import { translate } from "@/lib/locale/t";
import { ROUTES } from "@/lib/routes";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { buildBlogArticleJsonLd } from "@/lib/seo/structured-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostMeta(slug);
  // Server-side 404 — client `notFound()` alone does not set HTTP 404 on the document.
  if (!post) notFound();

  const title = translate(post.titleKey);
  const description = translate(post.excerptKey);
  const url = ROUTES.blogPost(slug);

  return publicPageMetadata({
    title,
    description,
    path: url,
    type: "article",
  });
}

export default async function BlogPostLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostMeta(slug);
  if (!post) notFound();

  return (
    <>
      <JsonLd
        data={buildBlogArticleJsonLd({
          title: translate(post.titleKey),
          description: translate(post.excerptKey),
          path: ROUTES.blogPost(slug),
          publishedOn: post.publishedOn,
        })}
      />
      {children}
    </>
  );
}
