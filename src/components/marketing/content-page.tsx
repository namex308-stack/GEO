"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PageContent } from "@/components/app/page-shell";
import { useLocalized, type Localized } from "@/lib/marketing/localized";
import { useT } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-store";
import { cn } from "@/lib/utils";

export type PageSection = {
  heading: Localized;
  paragraphs?: Localized[];
  bullets?: Localized[];
};

type ContentPageProps = {
  title: Localized;
  subtitle: Localized;
  icon: React.ComponentType<{ className?: string }>;
  sections: PageSection[];
  backHref?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function ContentPage({
  title,
  subtitle,
  icon: Icon,
  sections,
  backHref = "/",
  actions,
  children,
}: ContentPageProps) {
  const l = useLocalized();
  const t = useT();
  const { dir } = useLanguage();

  return (
    <MarketingShell>
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
            >
              <ChevronLeft className={cn("size-4", dir === "rtl" && "rotate-180")} />
              {t("footer.back")}
            </Link>
          )}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="size-12 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow shrink-0">
                <Icon className="size-6" />
              </span>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">{l(title)}</h1>
                <p className="text-sm text-muted-foreground mt-1">{l(subtitle)}</p>
              </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      </div>
      <PageContent className="max-w-3xl space-y-10">
        {sections.map((section, index) => (
          <section key={index}>
            <h2 className="font-display text-xl font-bold tracking-tight">{l(section.heading)}</h2>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
              {(section.paragraphs ?? []).map((paragraph, i) => (
                <p key={i}>{l(paragraph)}</p>
              ))}
            </div>
            {section.bullets && section.bullets.length > 0 && (
              <ul className="mt-4 space-y-2">
                {section.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary shrink-0 mt-2" />
                    <span>{l(bullet)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
        {children}
      </PageContent>
    </MarketingShell>
  );
}
