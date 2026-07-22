"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { ContentPage } from "@/components/marketing/content-page";
import { Button } from "@/components/ui/button";
import { AI_GENERATOR_CONTENT } from "@/lib/marketing/site-pages";
import { useLocalized } from "@/lib/marketing/localized";

export default function AiGeneratorPage() {
  const l = useLocalized();

  return (
    <ContentPage
      icon={Sparkles}
      title={AI_GENERATOR_CONTENT.title}
      subtitle={AI_GENERATOR_CONTENT.subtitle}
      sections={AI_GENERATOR_CONTENT.sections}
    >
      <div className="rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/5 to-transparent p-6">
        <h3 className="font-display text-lg font-bold">
          {l({ en: "Try it now", ar: "جرّبه الآن" })}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {l({
            en: "Run an audit first, then generate fixes from your report — or use the Content Improver tool on Pro.",
            ar: "أجرِ تحليلاً أولاً، ثم ولّد الإصلاحات من تقريرك — أو استخدم أداة Content Improver على Pro.",
          })}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild className="rounded-full shadow-glow">
            <Link href="/audit/new">{l({ en: "New audit", ar: "تحليل جديد" })}</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/tools/content-improver">{l({ en: "Content Improver", ar: "محسّن المحتوى" })}</Link>
          </Button>
        </div>
      </div>
    </ContentPage>
  );
}
