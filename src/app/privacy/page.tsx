"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ContentPage } from "@/components/marketing/content-page";
import { PRIVACY_CONTENT } from "@/lib/marketing/site-pages";
import { useLocalized } from "@/lib/marketing/localized";

export default function PrivacyPage() {
  const l = useLocalized();

  return (
    <ContentPage
      icon={ShieldCheck}
      title={PRIVACY_CONTENT.title}
      subtitle={PRIVACY_CONTENT.subtitle}
      sections={PRIVACY_CONTENT.sections}
    >
      <p className="text-xs text-muted-foreground">
        {l({ en: "Questions? Contact ", ar: "أسئلة؟ تواصل " })}
        <Link href="/contact" className="text-primary hover:underline">
          support@convaudit.ai
        </Link>
        {l({ en: " or visit our ", ar: " أو زر " })}
        <Link href="/contact" className="text-primary hover:underline">
          {l({ en: "Contact page", ar: "صفحة اتصل بنا" })}
        </Link>
        .
      </p>
    </ContentPage>
  );
}
