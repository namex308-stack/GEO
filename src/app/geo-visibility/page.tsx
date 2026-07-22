"use client";

import { Bot } from "lucide-react";
import Link from "next/link";
import { ContentPage } from "@/components/marketing/content-page";
import { Button } from "@/components/ui/button";
import { GEO_VISIBILITY_CONTENT } from "@/lib/marketing/site-pages";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useLocalized } from "@/lib/marketing/localized";

export default function GeoVisibilityPage() {
  const { startAuditAndNavigate } = useNavigateAfterAction();
  const l = useLocalized();

  return (
    <ContentPage
      icon={Bot}
      title={GEO_VISIBILITY_CONTENT.title}
      subtitle={GEO_VISIBILITY_CONTENT.subtitle}
      sections={GEO_VISIBILITY_CONTENT.sections}
      actions={
        <Button onClick={startAuditAndNavigate} className="rounded-full font-semibold shadow-glow">
          {l({ en: "Check GEO score", ar: "افحص درجة GEO" })}
        </Button>
      }
    >
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/features#geo-audit">{l({ en: "GEO audit details", ar: "تفاصيل تحليل GEO" })}</Link>
        </Button>
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/blog">{l({ en: "Read GEO guides", ar: "اقرأ أدلة GEO" })}</Link>
        </Button>
      </div>
    </ContentPage>
  );
}
