"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, Server, FileCheck2, Eye, KeyRound } from "lucide-react";
import { useT } from "@/lib/i18n";

const ITEMS = [
  { icon: ShieldCheck, titleKey: "security.s1.title", descKey: "security.s1.desc" },
  { icon: Lock, titleKey: "security.s2.title", descKey: "security.s2.desc" },
  { icon: Server, titleKey: "security.s3.title", descKey: "security.s3.desc" },
  { icon: KeyRound, titleKey: "security.s4.title", descKey: "security.s4.desc" },
  { icon: FileCheck2, titleKey: "security.s5.title", descKey: "security.s5.desc" },
  { icon: Eye, titleKey: "security.s6.title", descKey: "security.s6.desc" },
] as const;

export function SecurityBand() {
  const t = useT();
  return (
    <section id="security" className="py-20 sm:py-28 bg-muted/20 border-y border-border/40 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/8 blur-[120px] rounded-full -z-10" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
          <div className="lg:sticky lg:top-24">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t("security.eyebrow")}</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance">
              {t("security.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              {t("security.subtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["SOC2", "GDPR", "Egypt PDPL", "Saudi PDPL", "TLS 1.3", "AES-256"].map((b) => (
                <span key={b} className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-border/60 bg-card text-foreground/80">
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center mb-3">
                  <item.icon className="size-5" />
                </div>
                <h3 className="font-display font-bold text-sm">{t(item.titleKey)}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
