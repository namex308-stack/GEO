"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Twitter, Linkedin, Github, Mail } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

const COLS: { titleKey: TranslationKey; linkKeys: TranslationKey[] }[] = [
  {
    titleKey: "footer.col.product",
    linkKeys: ["footer.link.features", "footer.link.howItWorks", "footer.link.pricing", "footer.link.aiGenerator", "footer.link.geoVisibility", "footer.link.changelog"],
  },
  {
    titleKey: "footer.col.platforms",
    linkKeys: ["footer.link.shopify", "footer.link.woocommerce", "footer.link.salla", "footer.link.zid", "footer.link.customStores", "footer.link.affiliateSites"],
  },
  {
    titleKey: "footer.col.company",
    linkKeys: ["footer.link.about", "footer.link.blog", "footer.link.careers", "footer.link.partners", "footer.link.contact"],
  },
  {
    titleKey: "footer.col.legal",
    linkKeys: ["footer.link.privacy", "footer.link.terms", "footer.link.dataProcessing", "footer.link.refundPolicy", "footer.link.status"],
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
              {[Twitter, Linkedin, Github, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="size-9 grid place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-accent/60 transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="size-4" />
                </a>
              ))}
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
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {t(linkKey)}
                    </a>
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
