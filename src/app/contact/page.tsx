"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { ContentPage } from "@/components/marketing/content-page";
import { Button } from "@/components/ui/button";
import { CONTACT_CONTENT } from "@/lib/marketing/site-pages";
import { useLocalized } from "@/lib/marketing/localized";

export default function ContactPage() {
  const l = useLocalized();

  return (
    <ContentPage
      icon={Mail}
      title={CONTACT_CONTENT.title}
      subtitle={CONTACT_CONTENT.subtitle}
      sections={CONTACT_CONTENT.sections}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <a
          href="mailto:support@convaudit.ai"
          className="rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 transition-colors"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {l({ en: "Support", ar: "الدعم" })}
          </p>
          <p className="mt-2 font-semibold">support@convaudit.ai</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {l({ en: "Product & account help", ar: "مساعدة المنتج والحساب" })}
          </p>
        </a>
        <a
          href="mailto:hello@convaudit.ai"
          className="rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 transition-colors"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {l({ en: "Sales", ar: "المبيعات" })}
          </p>
          <p className="mt-2 font-semibold">hello@convaudit.ai</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {l({ en: "Partnerships & enterprise", ar: "الشراكات والمؤسسات" })}
          </p>
        </a>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/docs">{l({ en: "Documentation", ar: "التوثيق" })}</Link>
        </Button>
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/pricing">{l({ en: "Pricing", ar: "الأسعار" })}</Link>
        </Button>
      </div>
    </ContentPage>
  );
}
