"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Search,
  Bot,
  ShieldCheck,
  Zap,
  Gauge,
  Sparkles,
  LayoutDashboard,
  FileDown,
  Swords,
  UserCircle,
  CreditCard,
  BarChart3,
  Check,
} from "lucide-react";
import { PageHeader, PageContent } from "@/components/app/page-shell";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { MVP_FEATURES } from "@/lib/mvp-features";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Globe> = {
  "website-audit": Globe,
  "seo-audit": Search,
  "geo-audit": Bot,
  "trust-audit": ShieldCheck,
  "cro-audit": Zap,
  "overall-score": Gauge,
  "ai-recommendations": Sparkles,
  "ai-generator": Sparkles,
  dashboard: LayoutDashboard,
  "pdf-reports": FileDown,
  competitor: Swords,
  auth: UserCircle,
  billing: CreditCard,
  usage: BarChart3,
};

export default function FeaturesPage() {
  const t = useT();

  return (
    <MarketingShell>
      <PageHeader
        title={t("mvp.pageTitle")}
        subtitle={t("mvp.pageSubtitle")}
        icon={Sparkles}
      />
      <PageContent className="space-y-6 max-w-4xl">
        {MVP_FEATURES.map((feature, index) => {
          const Icon = ICONS[feature.id] ?? Sparkles;
          return (
            <motion.article
              key={feature.id}
              id={feature.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03 }}
              className={cn(
                "rounded-2xl border bg-card p-6 sm:p-8",
                feature.highlight ? "border-brand/40 bg-gradient-to-br from-brand/5 to-transparent" : "border-border/60"
              )}
            >
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    "size-12 rounded-xl grid place-items-center shrink-0",
                    feature.highlight ? "gradient-brand text-white" : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="size-6" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="outline" className="rounded-full text-[10px]">
                      {t("mvp.featureNumber", { n: feature.number })}
                    </Badge>
                    {feature.highlight && (
                      <Badge className="rounded-full gradient-brand text-white text-[10px]">
                        {t("mvp.keyFeature")}
                      </Badge>
                    )}
                  </div>
                  <h2 className="font-display text-xl font-bold">{t(feature.titleKey)}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{t(feature.descKey)}</p>
                  <ul className="mt-5 grid sm:grid-cols-2 gap-2">
                    {feature.items.map((item) => (
                      <li key={item.labelKey} className="flex items-start gap-2 text-sm">
                        <Check className="size-4 text-primary shrink-0 mt-0.5" />
                        <span>{t(item.labelKey)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.article>
          );
        })}
      </PageContent>
    </MarketingShell>
  );
}
