import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostContent } from "@/components/blog/blog-post-content";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog/posts";
import { buildBlogJsonLd, buildBlogPostMetadata, getBlogSeo } from "@/lib/blog/seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const seo = getBlogSeo(slug);
  if (!seo) return { title: "Article Not Found" };

  return buildBlogPostMetadata(slug, seo.metaTitle);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  const seo = getBlogSeo(slug);

  if (!post || !seo) {
    notFound();
  }

  const jsonLd = buildBlogJsonLd(slug, seo.metaTitle);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BlogPostContent slug={slug} />
    </>
  );
}
