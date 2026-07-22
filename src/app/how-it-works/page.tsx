"use client";

import { Link2 } from "lucide-react";
import Link from "next/link";
import { ContentPage } from "@/components/marketing/content-page";
import { Button } from "@/components/ui/button";
import { HOW_IT_WORKS_CONTENT } from "@/lib/marketing/site-pages";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useLocalized } from "@/lib/marketing/localized";

export default function HowItWorksPage() {
  const { startAuditAndNavigate } = useNavigateAfterAction();
  const l = useLocalized();

  return (
    <ContentPage
      icon={Link2}
      title={HOW_IT_WORKS_CONTENT.title}
      subtitle={HOW_IT_WORKS_CONTENT.subtitle}
      sections={HOW_IT_WORKS_CONTENT.sections}
      actions={
        <Button onClick={startAuditAndNavigate} className="rounded-full font-semibold shadow-glow">
          {l({ en: "Start free audit", ar: "ابدأ تحليلاً مجانياً" })}
        </Button>
      }
    >
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          {l({
            en: "See the full feature catalog or compare plans before you start.",
            ar: "اطلع على دليل الميزات الكامل أو قارن الخطط قبل البدء.",
          })}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/features">{l({ en: "View features", ar: "عرض الميزات" })}</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/pricing">{l({ en: "See pricing", ar: "عرض الأسعار" })}</Link>
          </Button>
        </div>
      </div>
    </ContentPage>
  );
}
