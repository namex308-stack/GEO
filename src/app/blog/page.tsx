"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Newspaper, ArrowUpRight, Clock } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { useT, type TranslationKey } from "@/lib/i18n";

type Post = {
  slug: string;
  titleKey: TranslationKey;
  excerptKey: TranslationKey;
  dateKey: TranslationKey;
  readTime: number;
  categoryKey: TranslationKey;
  color: string;
};

const POSTS: readonly Post[] = [
  { slug: "geo-ai-visibility-guide", titleKey: "blog.post1.title", excerptKey: "blog.post1.excerpt", dateKey: "blog.post1.date", readTime: 8, categoryKey: "blog.post1.category", color: "#FF6600" },
  { slug: "conversion-rate-optimization", titleKey: "blog.post2.title", excerptKey: "blog.post2.excerpt", dateKey: "blog.post2.date", readTime: 6, categoryKey: "blog.post2.category", color: "#ff983f" },
  { slug: "product-schema-markup", titleKey: "blog.post3.title", excerptKey: "blog.post3.excerpt", dateKey: "blog.post3.date", readTime: 10, categoryKey: "blog.post3.category", color: "#cc5200" },
  { slug: "competitor-analysis-strategy", titleKey: "blog.post4.title", excerptKey: "blog.post4.excerpt", dateKey: "blog.post4.date", readTime: 7, categoryKey: "blog.post4.category", color: "#929292" },
  { slug: "ai-product-descriptions", titleKey: "blog.post5.title", excerptKey: "blog.post5.excerpt", dateKey: "blog.post5.date", readTime: 5, categoryKey: "blog.post5.category", color: "#FF6600" },
  { slug: "trust-signals-ecommerce", titleKey: "blog.post6.title", excerptKey: "blog.post6.excerpt", dateKey: "blog.post6.date", readTime: 6, categoryKey: "blog.post6.category", color: "#ff983f" },
];

export default function BlogPage() {
  const t = useT();
  return (
    <PageShell>
      <PageHeader title={t("blog.title")} subtitle={t("blog.subtitle")} icon={Newspaper} />
      <PageContent>
        {/* Featured */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link href={`/blog/${POSTS[0].slug}`} className="block rounded-3xl border border-border/60 bg-card overflow-hidden hover:shadow-xl transition-shadow group">
            <div className="grid lg:grid-cols-2">
              <div className="aspect-video lg:aspect-auto lg:min-h-[300px] gradient-brand-soft relative overflow-hidden">
                <div className="absolute inset-0 bg-dots opacity-30" />
                <div className="absolute inset-0 grid place-items-center">
                  <span className="font-display text-6xl font-extrabold gradient-text">GEO</span>
                </div>
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ background: POSTS[0].color }}>{t(POSTS[0].categoryKey)}</span>
                  <span className="text-xs text-muted-foreground">{t(POSTS[0].dateKey)} · {t("blog.minRead", { count: POSTS[0].readTime })}</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold group-hover:text-primary transition-colors">{t(POSTS[0].titleKey)}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(POSTS[0].excerptKey)}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">{t("blog.readMore")} <ArrowUpRight className="size-4 group-hover:translate-x-0.5 transition-transform" /></span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {POSTS.slice(1).map((p, i) => (
            <motion.div key={p.slug} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <Link href={`/blog/${p.slug}`} className="block rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group h-full">
                <div className="aspect-video relative overflow-hidden" style={{ background: `${p.color}15` }}>
                  <div className="absolute inset-0 bg-dots opacity-20" />
                  <div className="absolute inset-0 grid place-items-center"><span className="font-display text-3xl font-extrabold" style={{ color: p.color }}>{t(p.categoryKey)}</span></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: p.color }}>{t(p.categoryKey)}</span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> {t("blog.minRead", { count: p.readTime })}</span>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">{t(p.titleKey)}</h3>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{t(p.excerptKey)}</p>
                  <span className="mt-3 inline-block text-[11px] text-muted-foreground">{t(p.dateKey)}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </PageContent>
    </PageShell>
  );
}
