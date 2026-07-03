"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Copy, Crown, FileText, Check } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

const CONTENT = {
  title: "سيروم توهج الأركان — إعادة ترطيب خلال 7 ليالٍ للبشرة الجافة والحساسة | ArganBloom",
  description: `استيقظ ببشرة أنعم وأكثر ترطيباً خلال 7 ليالٍ فقط.

سيروم ArganBloom النقي مصنوع من حبات الأركان المغربية المعصورة على البارد وممزوج بفيتامين E — تركيبة خالية من العطور للبشرة الجافة والحساسة.

**لماذا ستشعر بالفرق:**
- زيت أركان معصور على البارد 100% — غني بأوميغا 6 و9
- يعيد حاجز الرطوبة خلال 7 ليالٍ
- خالٍ من العطور، غير مسامي، غير دهني
- مصدر أخلاقي من تعاونيات نسائية في المغرب

30مل · تكفي 2-3 أشهر · يشحن خلال 24 ساعة.`,
  faq: [
    { q: "هل زيت الأركان مفيد للوجه؟", a: "نعم. زيت الأركان المعصور على البارد غني بأوميغا 6 و9 وفيتامين E، مما يجعله من أنعم الزيوت لترطيب الوجه. يعيد حاجز الرطوبة دون سد المسام — مثالي للبشرة الجافة والحساسة." },
    { q: "متى أرى النتائج؟", a: "معظم المستخدمين يلاحظون بشرة أنعم وأكثر ترطيباً خلال 7 ليالٍ من الاستخدام الليلي. لترميم الحاجز بالكامل، يُنصح بالاستخدام المنتظم لمدة 3-4 أسابيع." },
    { q: "هل يصلح للبشرة الحساسة؟", a: "بالتأكيد. السيروم خالٍ من العطور، غير مسامي ويحتوي فقط على زيت الأركان وفيتامين E — لا زيوت عطرية، لا كحول، لا عطور صناعية." },
  ],
  meta: "سيروم زيت أركان مغربي معصور على البارد للبشرة الجافة والحساسة. خالٍ من العطور، غير مسامي. ترطيب مرئي خلال 7 ليالٍ. يشحن خلال 24 ساعة.",
  ads: [
    { platform: "Meta / Instagram", headline: "إعادة ضبط بشرتك خلال 7 ليالٍ 🌿", body: "بشرة جافة ومشدودة؟ زيت الأركان المغربي يعيد حاجز الرطوبة — خالٍ من العطور، غير دهني، توهج مرئي خلال 7 ليالٍ.", cta: "تسوّق السيروم" },
    { platform: "TikTok", headline: "POV: وجدتِ الزيت الذي تحتاجه بشرتك", body: "3 قطرات ليلاً. بشرة أنعم صباحاً. لا عطور، لا تعقيد — أركان مغربي نقي.", cta: "اطلبيه الآن" },
    { platform: "Google Search", headline: "سيروم توهج الأركان — بشرة جافة وحساسة", body: "زيت أركان مغربي معصور على البارد. خالٍ من العطور. ترطيب مرئي خلال 7 ليالٍ. يشحن خلال 24 ساعة.", cta: "اطلب الآن" },
  ],
};

export default function GeneratePage() {
  const t = useT();
  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(t("generate.copied", { label }));
  };

  return (
    <PageShell>
      <PageHeader title={t("generate.title")} subtitle={t("generate.subtitle")} icon={Sparkles} back="/audit/demo/report" actions={<Badge className="gap-1 rounded-full gradient-brand text-white"><Crown className="size-3" /> {t("generate.pro")}</Badge>} />
      <PageContent>
        <Tabs defaultValue="title" className="w-full">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="title" className="rounded-lg">{t("generate.titleTab")}</TabsTrigger>
            <TabsTrigger value="description" className="rounded-lg">{t("generate.descriptionTab")}</TabsTrigger>
            <TabsTrigger value="faq" className="rounded-lg">{t("generate.faqTab")}</TabsTrigger>
            <TabsTrigger value="meta" className="rounded-lg">{t("generate.metaTab")}</TabsTrigger>
            <TabsTrigger value="ad" className="rounded-lg">{t("generate.adTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="title" className="mt-4">
            <GenCard label={t("generate.optimizedTitle")} onCopy={() => copyText(CONTENT.title, t("generate.titleTab"))} copyLabel={t("generate.copy")}>
              <p className="text-base font-display font-semibold leading-relaxed">{CONTENT.title}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full text-xs">{t("generate.seoOptimized")}</Badge>
                <Badge variant="outline" className="rounded-full text-xs">{t("generate.geoFriendly")}</Badge>
                <Badge variant="outline" className="rounded-full text-xs">{t("generate.chars", { count: CONTENT.title.length })}</Badge>
              </div>
            </GenCard>
          </TabsContent>

          <TabsContent value="description" className="mt-4">
            <GenCard label={t("generate.benefitDesc")} onCopy={() => copyText(CONTENT.description, t("generate.descriptionTab"))} copyLabel={t("generate.copy")}>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">{CONTENT.description}</pre>
            </GenCard>
          </TabsContent>

          <TabsContent value="faq" className="mt-4 space-y-3">
            {CONTENT.faq.map((f, i) => (
              <GenCard key={i} label={f.q} onCopy={() => copyText(`س: ${f.q}\nج: ${f.a}`, t("generate.question"))} copyLabel={t("generate.copy")}>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </GenCard>
            ))}
          </TabsContent>

          <TabsContent value="meta" className="mt-4">
            <GenCard label={t("generate.metaDesc")} onCopy={() => copyText(CONTENT.meta, t("generate.metaTab"))} copyLabel={t("generate.copy")}>
              <p className="text-sm font-mono leading-relaxed">{CONTENT.meta}</p>
              <div className="mt-2 text-xs text-muted-foreground">{t("generate.chars", { count: CONTENT.meta.length })} · {t("generate.idealFor")}</div>
            </GenCard>
          </TabsContent>

          <TabsContent value="ad" className="mt-4 space-y-3">
            {CONTENT.ads.map((ad, i) => (
              <GenCard key={i} label={ad.platform} onCopy={() => copyText(`${ad.headline}\n\n${ad.body}\n\nCTA: ${ad.cta}`, ad.platform)} copyLabel={t("generate.copy")}>
                <div className="text-base font-display font-bold">{ad.headline}</div>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{ad.body}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">CTA: {ad.cta}</div>
              </GenCard>
            ))}
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageShell>
  );
}

function GenCard({ label, onCopy, copyLabel, children }: { label: string; onCopy: () => void; copyLabel: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5"><FileText className="size-4" /> {label}</h4>
        <Button size="sm" variant="ghost" onClick={onCopy} className="rounded-full h-7 px-2.5 text-xs shrink-0"><Copy className="size-3 ml-1" /> {copyLabel}</Button>
      </div>
      {children}
    </motion.div>
  );
}
