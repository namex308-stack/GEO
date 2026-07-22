"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { MVP_FEATURES } from "@/lib/mvp-features";

/** Condensed MVP checklist on the landing page */
export function MvpCapabilities() {
  const t = useT();
  const preview = MVP_FEATURES.slice(0, 8);

  return (
    <section id="capabilities" className="py-20 sm:py-28 border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t("mvp.sectionEyebrow")}
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
            {t("mvp.sectionTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty">{t("mvp.sectionSubtitle")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {preview.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-primary shrink-0" />
                <h3 className="font-semibold text-sm">{t(feature.titleKey)}</h3>
              </div>
              <ul className="space-y-1.5 flex-1">
                {feature.items.slice(0, 4).map((item) => (
                  <li key={item.labelKey} className="flex gap-2 text-xs text-muted-foreground">
                    <Check className="size-3 text-primary shrink-0 mt-0.5" />
                    {t(item.labelKey)}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/features">
              {t("mvp.viewAll")} <ArrowRight className="size-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
