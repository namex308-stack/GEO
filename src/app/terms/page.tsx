"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { ContentPage } from "@/components/marketing/content-page";
import { TERMS_CONTENT } from "@/lib/marketing/site-pages";
import { useLocalized } from "@/lib/marketing/localized";

export default function TermsPage() {
  const l = useLocalized();

  return (
    <ContentPage
      icon={FileText}
      title={TERMS_CONTENT.title}
      subtitle={TERMS_CONTENT.subtitle}
      sections={TERMS_CONTENT.sections}
    >
      <p className="text-xs text-muted-foreground">
        {l({ en: "See also: ", ar: "انظر أيضاً: " })}
        <Link href="/privacy" className="text-primary hover:underline">
          {l({ en: "Privacy Policy", ar: "سياسة الخصوصية" })}
        </Link>
        {" · "}
        <Link href="/legal/refund-policy" className="text-primary hover:underline">
          {l({ en: "Refund Policy", ar: "سياسة الاسترداد" })}
        </Link>
      </p>
    </ContentPage>
  );
}
