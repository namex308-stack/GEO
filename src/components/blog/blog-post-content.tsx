"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, ArrowLeft, Share2, Twitter, Linkedin, ArrowUpRight, HelpCircle } from "lucide-react";
import { PageContent } from "@/components/app/page-shell";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { getBlogPost, getRelatedPosts } from "@/lib/blog/posts";
import { getBlogSeo } from "@/lib/blog/seo";

type BlogPostContentProps = {
  slug: string;
};

export function BlogPostContent({ slug }: BlogPostContentProps) {
  const t = useT();
  const post = getBlogPost(slug);
  const seo = getBlogSeo(slug);
  const related = post ? getRelatedPosts(post) : [];

  if (!post) {
    return (
      <MarketingShell>
        <PageContent className="max-w-3xl py-20 text-center">
          <p className="text-muted-foreground mb-6">{t("blog.notFound")}</p>
          <Button asChild className="rounded-full">
            <Link href="/blog">{t("blog.backToBlog")}</Link>
          </Button>
        </PageContent>
      </MarketingShell>
    );
  }

  return (
    <MarketingShell>
      <PageContent className="max-w-3xl py-10">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" /> {t("blog.backToBlog")}
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ background: post.color }}
            >
              {t(post.categoryKey)}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{t(post.dateKey)}</span>
              <span>·</span>
              <Clock className="size-3" /> {t("blog.minRead", { count: post.readTime })}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-balance">
            {t(post.titleKey)}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground text-pretty">{t(post.excerptKey)}</p>
        </motion.div>

        <div className="mt-6 aspect-[2/1] rounded-2xl relative overflow-hidden border border-border/40">
          <Image
            src={post.coverImage}
            alt={t(post.coverImageAltKey)}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>

        {seo && seo.keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{t("blog.keywordsLabel")}:</span>
            {seo.keywords.slice(0, 6).map((kw) => (
              <span
                key={kw}
                className="text-[11px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium"
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        <article className="mt-8 space-y-4">
          {post.content.map((block, i) => {
            if (block.type === "h2") {
              return (
                <motion.h2
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="font-display text-xl font-bold mt-8"
                >
                  {t(block.textKey)}
                </motion.h2>
              );
            }
            if (block.type === "h3") {
              return (
                <motion.h3
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="font-display text-lg font-semibold mt-6"
                >
                  {t(block.textKey)}
                </motion.h3>
              );
            }
            if (block.type === "image") {
              return (
                <motion.figure
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="my-6 rounded-xl overflow-hidden border border-border/40"
                >
                  <div className="relative aspect-[2/1]">
                    <Image
                      src={block.src}
                      alt={t(block.altKey)}
                      fill
                      sizes="(max-width: 768px) 100vw, 768px"
                      className="object-cover"
                    />
                  </div>
                </motion.figure>
              );
            }
            return (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-foreground/85 leading-relaxed"
              >
                {t(block.textKey)}
              </motion.p>
            );
          })}
        </article>

        {seo && seo.faq.length > 0 && (
          <section className="mt-10" aria-labelledby="blog-faq-heading">
            <div className="flex items-center gap-2 mb-5">
              <HelpCircle className="size-5 text-primary" />
              <h2 id="blog-faq-heading" className="font-display text-xl font-bold">
                {t("blog.faqTitle")}
              </h2>
            </div>
            <div className="space-y-3">
              {seo.faq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-border/60 bg-card open:border-primary/30 transition-colors"
                >
                  <summary className="cursor-pointer px-5 py-4 font-semibold text-sm leading-snug list-none flex items-start justify-between gap-3">
                    <span>{item.question}</span>
                    <span className="text-muted-foreground group-open:rotate-45 transition-transform text-lg leading-none shrink-0">
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 flex items-center gap-3 py-5 border-y border-border/60">
          <span className="text-sm font-medium text-muted-foreground">{t("blog.share")}</span>
          <button
            type="button"
            className="size-9 rounded-full border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            aria-label="Share on Twitter"
          >
            <Twitter className="size-4" />
          </button>
          <button
            type="button"
            className="size-9 rounded-full border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            aria-label="Share on LinkedIn"
          >
            <Linkedin className="size-4" />
          </button>
          <button
            type="button"
            className="size-9 rounded-full border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            aria-label="Share"
          >
            <Share2 className="size-4" />
          </button>
        </div>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-xl font-bold mb-4">{t("blog.relatedPosts")}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="block rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all group"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-muted">
                    <Image
                      src={r.coverImage}
                      alt={t(r.coverImageAltKey)}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white inline-block mb-2"
                    style={{ background: r.color }}
                  >
                    {t(r.categoryKey)}
                  </span>
                  <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
                    {t(r.titleKey)}
                  </h3>
                  <ArrowUpRight className="size-4 text-muted-foreground mt-2" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </PageContent>
    </MarketingShell>
  );
}
