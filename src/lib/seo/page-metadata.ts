import type { Metadata } from "next";
import { getLocaleConfig } from "@/lib/locale/config";
import { getActiveLocaleId } from "@/lib/locale/resolve";

type PublicPageMetadataInput = {
  title: string;
  description: string;
  path: string;
  /** Defaults to `website`. Use `article` for blog posts. */
  type?: "website" | "article";
  /**
   * When false, page stays crawlable for UX but is not indexed
   * (thin placeholders such as /status and /changelog).
   */
  indexable?: boolean;
};

/**
 * Shared metadata shape for crawlable marketing/content pages.
 * Titles are passed without the site suffix — root `title.template` appends `· ConvAudit`.
 * Canonical + OG `url` are path-relative and resolve via root `metadataBase`.
 */
export function publicPageMetadata({
  title,
  description,
  path,
  type = "website",
  indexable = true,
}: PublicPageMetadataInput): Metadata {
  const locale = getLocaleConfig(getActiveLocaleId());

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "ConvAudit",
      locale: locale.ogLocale,
      type,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: indexable
      ? { index: true, follow: true }
      : {
          // Thin public shells (/status, /changelog) — crawlable UX, not indexable.
          index: false,
          follow: true,
          googleBot: { index: false, follow: true },
        },
  };
}
