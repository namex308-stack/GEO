"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useT } from "@/lib/i18n";

export function CTA() {
  const t = useT();
  const { startAuditAndNavigate } = useNavigateAfterAction();
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-primary/30 gradient-brand px-6 py-16 sm:px-16 sm:py-20 text-center"
        >
          <div className="absolute inset-0 bg-dots opacity-20" />
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-brand/20 blur-3xl rounded-full" />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Sparkles className="size-3.5" /> {t("cta.badge")}
            </span>
            <h2 className="mt-5 font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white text-balance">
              {t("cta.title")}
            </h2>
            <p className="mt-4 text-lg text-white/85 max-w-xl mx-auto text-pretty">
              {t("cta.subtitle")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={startAuditAndNavigate}
                className="rounded-full text-base font-bold h-12 px-8 bg-white text-primary hover:bg-white/90 shadow-xl group"
              >
                {t("cta.button")}
                <ArrowRight className="size-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
            <p className="mt-5 text-sm text-white/70">
              {t("cta.social")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
