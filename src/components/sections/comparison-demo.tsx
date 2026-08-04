"use client";

import { motion } from "framer-motion";
import { ArrowRight, AlertTriangle, Lightbulb, Zap } from "lucide-react";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { Button } from "@/components/ui/button";
import { useT, type TranslationKey } from "@/lib/i18n";

const STEPS: {
  icon: typeof Zap;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  color: string;
}[] = [
  {
    icon: AlertTriangle,
    titleKey: "compDemo.step1",
    bodyKey: "compDemo.step1Body",
    color: "#f43f5e",
  },
  {
    icon: Lightbulb,
    titleKey: "compDemo.step2",
    bodyKey: "compDemo.step2Body",
    color: "#FF6600",
  },
  {
    icon: Zap,
    titleKey: "compDemo.step3",
    bodyKey: "compDemo.step3Body",
    color: "#cc5200",
  },
];

/** Marketing explainer only — no fabricated product recommendations. */
export function ComparisonDemo() {
  const { startAuditAndNavigate } = useNavigateAfterAction();
  const t = useT();
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t("compDemo.eyebrow")}
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-balance">
            {t("compDemo.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">{t("compDemo.subtitle")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("compDemo.liveOnly")}</p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border/60 bg-card p-6"
            >
              <span
                className="size-10 rounded-xl grid place-items-center mb-4"
                style={{ background: `${step.color}1a`, color: step.color }}
              >
                <step.icon className="size-5" />
              </span>
              <h3 className="font-display text-lg font-bold">{t(step.titleKey)}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t(step.bodyKey)}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button
            size="lg"
            onClick={startAuditAndNavigate}
            className="rounded-full font-semibold h-12 px-8 shadow-glow group"
          >
            {t("compDemo.cta")}
            <ArrowRight className="size-4 ms-1 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}
