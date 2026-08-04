"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bot, Radar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

/** Marketing explainer only — no fabricated scores or sample competitor data. */
export function ScoreShowcase() {
  const t = useT();
  return (
    <section id="scores" className="py-20 sm:py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              {t("scores.eyebrow")}
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-balance">
              {t("scores.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              {t("scores.subtitle")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("scores.liveOnly")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-full font-semibold shadow-glow">
                <Link href="/audit/new">{t("nav.startFreeAudit")}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/docs">{t("footer.docs")}</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="space-y-4"
          >
            {[
              {
                icon: Radar,
                title: t("scores.pillarsTitle"),
                body: t("scores.pillarsBody"),
              },
              {
                icon: Bot,
                title: t("scores.geo.title"),
                body: t("scores.geo.desc"),
              },
              {
                icon: Sparkles,
                title: t("scores.decisionTitle"),
                body: t("scores.decisionBody"),
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <card.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{card.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
