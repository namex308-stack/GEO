"use client";

import { motion } from "framer-motion";
import { Star, Quote, TrendingUp } from "lucide-react";
import { useT } from "@/lib/i18n";

const TESTIMONIALS = [
  {
    quoteKey: "testimonials.quote1",
    nameKey: "testimonials.name1",
    roleKey: "testimonials.role1",
    companyKey: "testimonials.company1",
    locationKey: "testimonials.location1",
    statKey: "testimonials.stat1",
    color: "#FF6600",
    featured: true,
  },
  {
    quoteKey: "testimonials.quote2",
    nameKey: "testimonials.name2",
    roleKey: "testimonials.role2",
    companyKey: "testimonials.company2",
    locationKey: "testimonials.location2",
    statKey: "testimonials.stat2",
    color: "#ff983f",
  },
  {
    quoteKey: "testimonials.quote3",
    nameKey: "testimonials.name3",
    roleKey: "testimonials.role3",
    companyKey: "testimonials.company3",
    locationKey: "testimonials.location3",
    statKey: "testimonials.stat3",
    color: "#ff983f",
  },
  {
    quoteKey: "testimonials.quote4",
    nameKey: "testimonials.name4",
    roleKey: "testimonials.role4",
    companyKey: "testimonials.company4",
    locationKey: "testimonials.location4",
    statKey: "testimonials.stat4",
    color: "#cc5200",
  },
  {
    quoteKey: "testimonials.quote5",
    nameKey: "testimonials.name5",
    roleKey: "testimonials.role5",
    companyKey: "testimonials.company5",
    locationKey: "testimonials.location5",
    statKey: "testimonials.stat5",
    color: "#FF6600",
  },
] as const;

export function Testimonials() {
  const t = useT();
  const featured = TESTIMONIALS[0];
  const rest = TESTIMONIALS.slice(1);

  return (
    <section className="py-20 sm:py-28 bg-muted/20 border-y border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="size-5 fill-brand text-brand" />
            ))}
          </div>
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Loved by 1,200+ stores</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance">
            {t("testimonials.title")}
          </h2>
        </div>

        {/* Featured testimonial */}
        <motion.figure
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-14 relative rounded-3xl border border-border/60 bg-card p-8 sm:p-12 overflow-hidden max-w-4xl mx-auto"
        >
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20" style={{ background: featured.color }} />
          <div className="absolute top-6 left-6 font-display text-7xl leading-none opacity-10" style={{ color: featured.color }}>"</div>
          <div className="relative">
            <Quote className="size-10 mb-5" style={{ color: featured.color }} />
            <blockquote className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold leading-snug text-foreground text-balance">
              {t(featured.quoteKey)}
            </blockquote>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
              <figcaption className="flex items-center gap-3">
                <span className="size-12 rounded-full grid place-items-center text-white text-base font-bold" style={{ background: featured.color }}>
                  {t(featured.nameKey).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
                <div>
                  <div className="font-semibold">{t(featured.nameKey)}</div>
                  <div className="text-sm text-muted-foreground">{t(featured.roleKey)}, {t(featured.companyKey)} · {t(featured.locationKey)}</div>
                </div>
              </figcaption>
              <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full" style={{ background: `${featured.color}1a`, color: featured.color }}>
                <TrendingUp className="size-4" /> {t(featured.statKey)}
              </div>
            </div>
          </div>
        </motion.figure>

        {/* Grid of others */}
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {rest.map((tm, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl border border-border/60 bg-card p-5 hover:shadow-lg transition-shadow flex flex-col"
            >
              <Quote className="size-6 mb-3" style={{ color: `${tm.color}80` }} />
              <blockquote className="text-sm leading-relaxed text-foreground/85 text-pretty flex-1">
                {t(tm.quoteKey)}
              </blockquote>
              <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full w-fit" style={{ background: `${tm.color}1a`, color: tm.color }}>
                {t(tm.statKey)}
              </div>
              <figcaption className="mt-4 flex items-center gap-2.5 pt-4 border-t border-border/50">
                <span className="size-9 rounded-full grid place-items-center text-white text-xs font-bold" style={{ background: tm.color }}>
                  {t(tm.nameKey).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{t(tm.nameKey)}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{t(tm.roleKey)}, {t(tm.companyKey)}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
