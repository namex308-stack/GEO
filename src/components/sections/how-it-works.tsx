"use client";

import { motion } from "framer-motion";
import { Link2, Cpu, FileCheck2 } from "lucide-react";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

const STEPS = [
  {
    icon: Link2,
    step: "01",
    titleKey: "how.step1.title",
    descKey: "how.step1.desc",
  },
  {
    icon: Cpu,
    step: "02",
    titleKey: "how.step2.title",
    descKey: "how.step2.desc",
  },
  {
    icon: FileCheck2,
    step: "03",
    titleKey: "how.step3.title",
    descKey: "how.step3.desc",
  },
] as const;

export function HowItWorks() {
  const t = useT();
  const { startAuditAndNavigate } = useNavigateAfterAction();
  return (
    <section id="how" className="py-20 sm:py-28 bg-muted/20 border-y border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">{t("how.eyebrow")}</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance">
            {t("how.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            {t("how.subtitle")}
          </p>
        </div>

        <div className="mt-14 grid md:grid-cols-3 gap-6 relative">
          {/* connecting line */}
          <div className="hidden md:block absolute top-14 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative rounded-2xl border border-border/60 bg-card p-6 text-center"
            >
              <div className="mx-auto size-14 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow mb-5 relative z-10">
                <s.icon className="size-6" />
              </div>
              <div className="text-xs font-mono font-bold text-primary mb-1">{s.step}</div>
              <h3 className="font-display text-lg font-bold">{t(s.titleKey)}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(s.descKey)}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" onClick={startAuditAndNavigate} className="rounded-full font-semibold h-12 px-8 shadow-glow">
            {t("how.cta")}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">{t("how.ctaSub")}</p>
        </div>
      </div>
    </section>
  );
}
