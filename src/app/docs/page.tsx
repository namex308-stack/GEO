"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Code2, Zap, Bot, ShieldCheck, Search, ArrowUpRight, Terminal } from "lucide-react";
import { PageHeader, PageContent } from "@/components/app/page-shell";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { useT, type TranslationKey } from "@/lib/i18n";

type Section = {
  icon: typeof Zap;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  itemKeys: readonly TranslationKey[];
  itemHrefs: readonly string[];
};

const SECTIONS: readonly Section[] = [
  {
    icon: Zap,
    titleKey: "docs.quickStart",
    descKey: "docs.quickStartDesc",
    itemKeys: ["docs.quickStart.item1", "docs.quickStart.item2", "docs.quickStart.item3", "docs.quickStart.item4"],
    itemHrefs: ["/signup", "/onboarding", "/audit/new", "/how-it-works"],
  },
  {
    icon: Search,
    titleKey: "docs.understandScores",
    descKey: "docs.understandScoresDesc",
    itemKeys: ["docs.understandScores.item1", "docs.understandScores.item2", "docs.understandScores.item3", "docs.understandScores.item4"],
    itemHrefs: ["/features#cro-audit", "/features#seo-audit", "/geo-visibility", "/features#trust-audit"],
  },
  {
    icon: Bot,
    titleKey: "docs.aiGenerator",
    descKey: "docs.aiGeneratorDesc",
    itemKeys: ["docs.aiGenerator.item1", "docs.aiGenerator.item2", "docs.aiGenerator.item3", "docs.aiGenerator.item4"],
    itemHrefs: ["/ai-generator", "/ai-generator", "/ai-generator", "/tools/content-improver"],
  },
  {
    icon: ShieldCheck,
    titleKey: "docs.watchAlerts",
    descKey: "docs.watchAlertsDesc",
    itemKeys: ["docs.watchAlerts.item1", "docs.watchAlerts.item2", "docs.watchAlerts.item3", "docs.watchAlerts.item4"],
    itemHrefs: ["/watch", "/watch/alerts", "/watch", "/pricing"],
  },
  {
    icon: Code2,
    titleKey: "docs.api",
    descKey: "docs.apiDesc",
    itemKeys: ["docs.api.item1", "docs.api.item2", "docs.api.item3", "docs.api.item4"],
    itemHrefs: ["/api", "/api", "/pricing", "/docs#4"],
  },
];

export default function DocsPage() {
  const t = useT();
  return (
    <MarketingShell>
      <PageHeader title={t("docs.title")} subtitle={t("docs.subtitle")} icon={BookOpen} />
      <PageContent className="grid lg:grid-cols-[1fr_2fr] gap-8">
        <div className="lg:sticky lg:top-24 h-fit space-y-1">
          {SECTIONS.map((s, i) => (
            <a key={i} href={`#${i}`} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors">
              <s.icon className="size-4" /> {t(s.titleKey)}
            </a>
          ))}
        </div>

        <div className="space-y-10">
          {SECTIONS.map((s, i) => (
            <motion.section key={i} id={`${i}`} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><s.icon className="size-5" /></span>
                <div><h2 className="font-display text-xl font-bold">{t(s.titleKey)}</h2><p className="text-sm text-muted-foreground">{t(s.descKey)}</p></div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
                {s.itemKeys.map((itemKey, j) => (
                  <Link key={j} href={s.itemHrefs[j] ?? "/docs"} className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-accent/40 transition-colors text-sm group">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="flex-1">{t(itemKey)}</span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </motion.section>
          ))}

          <section>
            <h2 className="font-display text-xl font-bold mb-3 flex items-center gap-2"><Terminal className="size-5 text-primary" /> {t("docs.quickExample")}</h2>
            <div className="rounded-2xl border border-border/60 bg-muted/30 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-muted/50">
                <span className="size-2.5 rounded-full bg-rose-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono text-muted-foreground mr-2">terminal</span>
              </div>
              <pre className="p-4 text-xs font-mono overflow-x-auto" dir="ltr"><code>{`${t("docs.code.runNewAudit")}
curl -X POST https://convaudit.ai/api/audit \\
  -H "Content-Type: application/json" \\
  -d '{"productUrl": "https://shop.example.com/products/serum"}'

${t("docs.code.result")}
{ "audit": { "overallScore": 82, ... } }`}</code></pre>
            </div>
          </section>
        </div>
      </PageContent>
    </MarketingShell>
  );
}
