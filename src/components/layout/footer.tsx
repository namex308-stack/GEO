"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Linkedin } from "lucide-react";
import { useT, type TranslationKey } from "@/lib/i18n";
import { LINKEDIN_URL } from "@/lib/brand";

const FOOTER_HREFS: Partial<Record<TranslationKey, string>> = {
  "footer.link.features": "/features",
  "footer.link.howItWorks": "/how-it-works",
  "footer.link.pricing": "/pricing",
  "footer.link.aiGenerator": "/ai-generator",
  "footer.link.geoVisibility": "/geo-visibility",
  "footer.link.about": "/about",
  "footer.link.blog": "/blog",
  "footer.link.contact": "/contact",
  "footer.link.privacy": "/privacy",
  "footer.link.terms": "/terms",
  "footer.link.refundPolicy": "/legal/refund-policy",
};

const COLS: { titleKey: TranslationKey; linkKeys: TranslationKey[] }[] = [
  {
    titleKey: "footer.col.product",
    linkKeys: ["footer.link.features", "footer.link.howItWorks", "footer.link.pricing", "footer.link.aiGenerator", "footer.link.geoVisibility"],
  },
  {
    titleKey: "footer.col.company",
    linkKeys: ["footer.link.about", "footer.link.blog", "footer.link.contact"],
  },
  {
    titleKey: "footer.col.legal",
    linkKeys: ["footer.link.privacy", "footer.link.terms", "footer.link.refundPolicy"],
  },
];

export function Footer() {
  const t = useT();
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <Link href="/">
              <Logo />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              {t("footer.tagline")}
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 grid place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent/60 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="size-4" />
              </a>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.titleKey}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                {t(col.titleKey)}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.linkKeys.map((linkKey) => (
                  <li key={linkKey}>
                    <Link
                      href={FOOTER_HREFS[linkKey] ?? "/features"}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t(linkKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary animate-pulse" />
              {t("footer.allSystems")}
            </span>
            <span>·</span>
            <span>{t("footer.poweredBy")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
