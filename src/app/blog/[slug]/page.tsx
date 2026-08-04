"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, ArrowLeft, Share2, Twitter, Linkedin, ArrowUpRight } from "lucide-react";
import { PageShell, PageContent } from "@/components/app/page-shell";
import { useT, type TranslationKey } from "@/lib/i18n";

type ContentBlock = {
  type: "h2" | "h3" | "p";
  textKey: TranslationKey;
};

type BlogPost = {
  slug: string;
  titleKey: TranslationKey;
  excerptKey: TranslationKey;
  dateKey: TranslationKey;
  readTime: number;
  categoryKey: TranslationKey;
  color: string;
  content: readonly ContentBlock[];
};

const POSTS: readonly BlogPost[] = [
  {
    slug: "geo-ai-visibility-guide",
    titleKey: "blog.post1.title",
    excerptKey: "blog.post1.excerpt",
    dateKey: "blog.post1.date",
    readTime: 8,
    categoryKey: "blog.post1.category",
    color: "#FF6600",
    content: [
      { type: "h2", textKey: "blog.post.geo.h2_1" },
      { type: "p", textKey: "blog.post.geo.p_1" },
      { type: "h2", textKey: "blog.post.geo.h2_2" },
      { type: "p", textKey: "blog.post.geo.p_2" },
      { type: "h2", textKey: "blog.post.geo.h2_3" },
      { type: "h3", textKey: "blog.post.geo.h3_1" },
      { type: "p", textKey: "blog.post.geo.p_3" },
      { type: "h3", textKey: "blog.post.geo.h3_2" },
      { type: "p", textKey: "blog.post.geo.p_4" },
      { type: "h3", textKey: "blog.post.geo.h3_3" },
      { type: "p", textKey: "blog.post.geo.p_5" },
      { type: "h3", textKey: "blog.post.geo.h3_4" },
      { type: "p", textKey: "blog.post.geo.p_6" },
      { type: "h3", textKey: "blog.post.geo.h3_5" },
      { type: "p", textKey: "blog.post.geo.p_7" },
      { type: "h2", textKey: "blog.post.geo.h2_4" },
      { type: "p", textKey: "blog.post.geo.p_8" },
    ],
  },
  {
    slug: "conversion-rate-optimization",
    titleKey: "blog.post2.title",
    excerptKey: "blog.post2.excerpt",
    dateKey: "blog.post2.date",
    readTime: 6,
    categoryKey: "blog.post2.category",
    color: "#ff983f",
    content: [
      { type: "h2", textKey: "blog.post2.body.h2_1" },
      { type: "p", textKey: "blog.post2.body.p_1" },
      { type: "h2", textKey: "blog.post2.body.h2_2" },
      { type: "p", textKey: "blog.post2.body.p_2" },
      { type: "h2", textKey: "blog.post2.body.h2_3" },
      { type: "p", textKey: "blog.post2.body.p_3" },
    ],
  },
  {
    slug: "product-schema-markup",
    titleKey: "blog.post3.title",
    excerptKey: "blog.post3.excerpt",
    dateKey: "blog.post3.date",
    readTime: 10,
    categoryKey: "blog.post3.category",
    color: "#cc5200",
    content: [
      { type: "h2", textKey: "blog.post3.body.h2_1" },
      { type: "p", textKey: "blog.post3.body.p_1" },
      { type: "h2", textKey: "blog.post3.body.h2_2" },
      { type: "p", textKey: "blog.post3.body.p_2" },
      { type: "h2", textKey: "blog.post3.body.h2_3" },
      { type: "p", textKey: "blog.post3.body.p_3" },
    ],
  },
  {
    slug: "competitor-analysis-strategy",
    titleKey: "blog.post4.title",
    excerptKey: "blog.post4.excerpt",
    dateKey: "blog.post4.date",
    readTime: 7,
    categoryKey: "blog.post4.category",
    color: "#929292",
    content: [
      { type: "h2", textKey: "blog.post4.body.h2_1" },
      { type: "p", textKey: "blog.post4.body.p_1" },
      { type: "h2", textKey: "blog.post4.body.h2_2" },
      { type: "p", textKey: "blog.post4.body.p_2" },
      { type: "h2", textKey: "blog.post4.body.h2_3" },
      { type: "p", textKey: "blog.post4.body.p_3" },
    ],
  },
  {
    slug: "ai-product-descriptions",
    titleKey: "blog.post5.title",
    excerptKey: "blog.post5.excerpt",
    dateKey: "blog.post5.date",
    readTime: 5,
    categoryKey: "blog.post5.category",
    color: "#FF6600",
    content: [
      { type: "h2", textKey: "blog.post5.body.h2_1" },
      { type: "p", textKey: "blog.post5.body.p_1" },
      { type: "h2", textKey: "blog.post5.body.h2_2" },
      { type: "p", textKey: "blog.post5.body.p_2" },
      { type: "h2", textKey: "blog.post5.body.h2_3" },
      { type: "p", textKey: "blog.post5.body.p_3" },
    ],
  },
  {
    slug: "trust-signals-ecommerce",
    titleKey: "blog.post6.title",
    excerptKey: "blog.post6.excerpt",
    dateKey: "blog.post6.date",
    readTime: 6,
    categoryKey: "blog.post6.category",
    color: "#ff983f",
    content: [
      { type: "h2", textKey: "blog.post6.body.h2_1" },
      { type: "p", textKey: "blog.post6.body.p_1" },
      { type: "h2", textKey: "blog.post6.body.h2_2" },
      { type: "p", textKey: "blog.post6.body.p_2" },
      { type: "h2", textKey: "blog.post6.body.h2_3" },
      { type: "p", textKey: "blog.post6.body.p_3" },
    ],
  },
];

function relatedFor(slug: string): readonly BlogPost[] {
  return POSTS.filter((p) => p.slug !== slug).slice(0, 3);
}

export default function BlogPostPage() {
  const t = useT();
  const params = useParams();
  const slug = params.slug as string;
  const POST = POSTS.find((p) => p.slug === slug);

  if (!POST) {
    notFound();
  }

  const RELATED = relatedFor(slug);

  return (
    <PageShell>
      <PageContent className="max-w-3xl py-10">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="size-4 rtl:rotate-180" /> {t("blog.backToBlog")}
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: POST.color }}>{t(POST.categoryKey)}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-2"><span>{t(POST.dateKey)}</span><span>·</span><Clock className="size-3" /> {t("blog.minRead", { count: POST.readTime })}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight text-balance">{t(POST.titleKey)}</h1>
          <p className="mt-3 text-lg text-muted-foreground text-pretty">{t(POST.excerptKey)}</p>
        </motion.div>

        {/* Cover */}
        <div className="mt-6 aspect-[2/1] rounded-2xl gradient-brand-soft relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-25" />
          <div className="absolute inset-0 grid place-items-center"><span className="font-display text-7xl font-extrabold gradient-text">GEO</span></div>
        </div>

        {/* Content */}
        <article className="mt-8 space-y-4">
          {POST.content.map((block, i) => {
            if (block.type === "h2") return <motion.h2 key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-xl font-bold mt-8">{t(block.textKey)}</motion.h2>;
            if (block.type === "h3") return <motion.h3 key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="font-display text-lg font-semibold mt-6">{t(block.textKey)}</motion.h3>;
            return <motion.p key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-foreground/85 leading-relaxed">{t(block.textKey)}</motion.p>;
          })}
        </article>

        {/* Share */}
        <div className="mt-8 flex items-center gap-3 py-5 border-y border-border/60">
          <span className="text-sm font-medium text-muted-foreground">{t("blog.share")}</span>
          <button className="size-9 rounded-full border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"><Twitter className="size-4" /></button>
          <button className="size-9 rounded-full border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"><Linkedin className="size-4" /></button>
          <button className="size-9 rounded-full border border-border/60 grid place-items-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"><Share2 className="size-4" /></button>
        </div>

        {/* Related */}
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold mb-4">{t("blog.relatedPosts")}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {RELATED.map((r, i) => (
              <Link key={i} href={`/blog/${r.slug}`} className="block rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-md transition-all group">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white inline-block mb-2" style={{ background: r.color }}>{t(r.categoryKey)}</span>
                <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">{t(r.titleKey)}</h3>
                <ArrowUpRight className="size-4 text-muted-foreground mt-2" />
              </Link>
            ))}
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
