"use client";

import { motion } from "framer-motion";
import { Zap, Search, Bot, ShieldCheck, ArrowUpRight, Quote } from "lucide-react";
import { useT } from "@/lib/i18n";

const PILLARS = [
  {
    icon: Zap,
    nameKey: "features.conversion.name",
    eyebrow: "01",
    color: "#FF6600",
    descKey: "features.conversion.desc",
    pointKeys: [
      "features.conversion.p1",
      "features.conversion.p2",
      "features.conversion.p3",
      "features.conversion.p4",
    ],
    quoteKey: "features.conversion.quote",
    authorKey: "features.conversion.author",
  },
  {
    icon: Search,
    nameKey: "features.seo.name",
    eyebrow: "02",
    color: "#ff983f",
    descKey: "features.seo.desc",
    pointKeys: [
      "features.seo.p1",
      "features.seo.p2",
      "features.seo.p3",
      "features.seo.p4",
    ],
    quoteKey: "features.seo.quote",
    authorKey: "features.seo.author",
  },
  {
    icon: Bot,
    nameKey: "features.geo.name",
    eyebrow: "03",
    color: "#ff983f",
    descKey: "features.geo.desc",
    pointKeys: [
      "features.geo.p1",
      "features.geo.p2",
      "features.geo.p3",
      "features.geo.p4",
    ],
    quoteKey: "features.geo.quote",
    authorKey: "features.geo.author",
  },
  {
    icon: ShieldCheck,
    nameKey: "features.trust.name",
    eyebrow: "04",
    color: "#cc5200",
    descKey: "features.trust.desc",
    pointKeys: [
      "features.trust.p1",
      "features.trust.p2",
      "features.trust.p3",
      "features.trust.p4",
    ],
    quoteKey: "features.trust.quote",
    authorKey: "features.trust.author",
  },
] as const;

export function Features() {
  const t = useT();
  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t("features.eyebrow")}</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance">
            {t("features.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 gap-5">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.eyebrow}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative rounded-2xl border border-border/60 bg-card p-6 sm:p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* gradient accent */}
              <div
                className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity"
                style={{ background: p.color }}
              />
              <div className="relative">
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="size-14 rounded-2xl grid place-items-center"
                    style={{ background: `${p.color}1a`, color: p.color }}
                  >
                    <p.icon className="size-7" />
                  </div>
                  <span className="font-display text-3xl font-extrabold opacity-15" style={{ color: p.color }}>
                    {p.eyebrow}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold">{t(p.nameKey)}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(p.descKey)}</p>

                <ul className="mt-5 space-y-2">
                  {p.pointKeys.map((ptKey) => (
                    <li key={ptKey} className="flex items-center gap-2 text-xs text-foreground/80">
                      <span className="size-1.5 rounded-full shrink-0" style={{ background: p.color }} />
                      {t(ptKey)}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 pt-4 border-t border-border/50 flex items-start gap-2.5">
                  <Quote className="size-4 shrink-0 mt-0.5" style={{ color: p.color }} />
                  <div>
                    <p className="text-xs italic text-foreground/80 leading-relaxed">"{t(p.quoteKey)}"</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">{t(p.authorKey)}</p>
                  </div>
                </div>
              </div>
              <ArrowUpRight className="absolute top-6 right-6 size-4 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
