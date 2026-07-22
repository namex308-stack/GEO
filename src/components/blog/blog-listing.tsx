"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Newspaper, ArrowUpRight, Clock } from "lucide-react";
import { PageHeader, PageContent } from "@/components/app/page-shell";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { useT } from "@/lib/i18n";
import { BLOG_POSTS } from "@/lib/blog/posts";

export function BlogListing() {
  const t = useT();
  const featured = BLOG_POSTS[0]!;

  return (
    <MarketingShell>
      <PageHeader title={t("blog.title")} subtitle={t("blog.subtitle")} icon={Newspaper} />
      <PageContent>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Link
            href={`/blog/${featured.slug}`}
            className="block rounded-3xl border border-border/60 bg-card overflow-hidden hover:shadow-xl transition-shadow group"
          >
            <div className="grid lg:grid-cols-2">
              <div className="aspect-video lg:aspect-auto lg:min-h-[300px] relative overflow-hidden bg-muted">
                <Image
                  src={featured.coverImage}
                  alt={t(featured.coverImageAltKey)}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                    style={{ background: featured.color }}
                  >
                    {t(featured.categoryKey)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(featured.dateKey)} · {t("blog.minRead", { count: featured.readTime })}
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold group-hover:text-primary transition-colors">
                  {t(featured.titleKey)}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(featured.excerptKey)}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {t("blog.readMore")}{" "}
                  <ArrowUpRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {BLOG_POSTS.slice(1).map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={`/blog/${p.slug}`}
                className="block rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group h-full"
              >
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <Image
                    src={p.coverImage}
                    alt={t(p.coverImageAltKey)}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: p.color }}
                    >
                      {t(p.categoryKey)}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> {t("blog.minRead", { count: p.readTime })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors">
                    {t(p.titleKey)}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{t(p.excerptKey)}</p>
                  <span className="mt-3 inline-block text-[11px] text-muted-foreground">{t(p.dateKey)}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </PageContent>
    </MarketingShell>
  );
}
