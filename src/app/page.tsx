import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getUser } from "@/lib/supabase/server";
import { buildPageMetadata, getSiteUrl, PAGE_SEO } from "@/lib/seo";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  ...buildPageMetadata(PAGE_SEO.home),
  title: {
    absolute: PAGE_SEO.home.title,
  },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does the AI audit work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paste a product URL and Firecrawl reads the full rendered page. Gemini then scores it across conversion, SEO, GEO visibility and trust, benchmarks it against your competitor, and generates prioritized recommendations plus ready-to-paste copy.",
      },
    },
    {
      "@type": "Question",
      name: "What is GEO / AI Visibility scoring?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GEO (Generative Engine Optimization) measures whether AI assistants like ChatGPT, Perplexity and Google AI can parse your page and would recommend your product.",
      },
    },
    {
      "@type": "Question",
      name: "Which platforms are supported?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Any public product page works — Shopify, WooCommerce, Salla, Zid, Magento, Wix, custom stores and affiliate landing pages.",
      },
    },
  ],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND_NAME,
  url: getSiteUrl(),
};

export default async function Home() {
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <AppShell />
    </>
  );
}
