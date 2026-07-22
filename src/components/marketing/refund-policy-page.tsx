"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { ContentPage } from "@/components/marketing/content-page";
import { REFUND_CONTENT } from "@/lib/marketing/site-pages";
import { useLocalized } from "@/lib/marketing/localized";

export function RefundPolicyPage() {
  const l = useLocalized();

  return (
    <ContentPage
      icon={RotateCcw}
      title={REFUND_CONTENT.title}
      subtitle={REFUND_CONTENT.subtitle}
      sections={REFUND_CONTENT.sections}
    >
      <p className="text-xs text-muted-foreground">
        {l({ en: "Need help? ", ar: "تحتاج مساعدة؟ " })}
        <a href="mailto:support@yourdomain.com" className="text-primary hover:underline">
          support@yourdomain.com
        </a>
        {" · "}
        <Link href="/contact" className="text-primary hover:underline">
          {l({ en: "Contact support", ar: "تواصل مع الدعم" })}
        </Link>
        {" · "}
        <Link href="/terms" className="text-primary hover:underline">
          {l({ en: "Terms of Service", ar: "شروط الخدمة" })}
        </Link>
      </p>
    </ContentPage>
  );
}
