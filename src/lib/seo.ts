import type { Metadata } from "next";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || BRAND_URL;
}

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: readonly string[];
  noIndex?: boolean;
  type?: "website" | "article";
};

/** Shared metadata builder for marketing, legal, and utility pages. */
export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex = false,
  type = "website",
}: BuildPageMetadataOptions): Metadata {
  const url = new URL(path, getSiteUrl()).toString();

  return {
    title,
    description,
    keywords: keywords ? [...keywords] : undefined,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: BRAND_NAME,
      type,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
  };
}

/** Per-route SEO copy for public pages. */
export const PAGE_SEO = {
  home: {
    title: "convaudit — AI-Powered E-commerce Audit & Optimization",
    description:
      "Audit any store or product page in 60 seconds. Get AI-powered scores for conversion, SEO, GEO visibility, and trust — benchmarked against competitors. Built for Shopify, WooCommerce, Salla & Zid.",
    path: "/",
    keywords: [
      "e-commerce audit",
      "product page optimization",
      "conversion rate optimization",
      "GEO SEO",
      "AI store audit",
      "Shopify audit",
      "Salla",
      "Zid",
      "WooCommerce audit",
    ],
  },
  features: {
    title: "Features",
    description:
      "Explore convaudit features: conversion scoring, SEO audit, GEO AI visibility, trust signals, competitor benchmarking, AI Generator, PDF reports, and continuous monitoring.",
    path: "/features",
    keywords: ["e-commerce audit features", "CRO audit", "GEO visibility", "AI product page tools"],
  },
  howItWorks: {
    title: "How It Works",
    description:
      "Paste a product URL and get a full conversion, SEO, GEO, and trust audit in under 60 seconds — with prioritized fixes and AI-generated copy.",
    path: "/how-it-works",
    keywords: ["how e-commerce audit works", "product page audit", "AI store optimization"],
  },
  pricing: {
    title: "Pricing",
    description:
      "Simple convaudit pricing for growing stores. Start free with 3 audits/month, or upgrade to Pro and Business for full analysis, AI fixes, and competitor insights.",
    path: "/pricing",
    keywords: ["convaudit pricing", "e-commerce audit pricing", "AI SEO tool cost"],
  },
  aiGenerator: {
    title: "AI Generator",
    description:
      "Gemini-powered copy fixes tailored to your audit findings — SEO titles, meta descriptions, FAQs, product copy, and ad creatives ready to paste.",
    path: "/ai-generator",
    keywords: ["AI product copy generator", "SEO meta generator", "FAQ schema AI"],
  },
  geoVisibility: {
    title: "GEO Visibility",
    description:
      "Measure and improve how ChatGPT, Perplexity, and Google AI discover your products. Generative Engine Optimization scoring and actionable fixes.",
    path: "/geo-visibility",
    keywords: ["GEO visibility", "generative engine optimization", "ChatGPT product visibility"],
  },
  about: {
    title: "About",
    description:
      "Learn about convaudit — the AI audit platform helping MENA e-commerce brands optimize conversion, SEO, GEO visibility, and trust on every product page.",
    path: "/about",
    keywords: ["about convaudit", "AI e-commerce platform", "MENA store optimization"],
  },
  contact: {
    title: "Contact",
    description:
      "Get in touch with the convaudit team for support, sales, partnerships, or billing questions. We typically respond within one business day.",
    path: "/contact",
    keywords: ["contact convaudit", "e-commerce audit support"],
  },
  privacy: {
    title: "Privacy Policy",
    description:
      "How convaudit collects, uses, and protects your data. Read our privacy practices for accounts, audits, payments, and third-party processors.",
    path: "/privacy",
  },
  terms: {
    title: "Terms of Service",
    description:
      "Terms governing use of the convaudit platform, including subscriptions, acceptable use, intellectual property, and limitation of liability.",
    path: "/terms",
  },
  refund: {
    title: "Refund Policy",
    description:
      "Learn about convaudit's refund eligibility, subscription cancellation, billing errors, and money-back guarantee.",
    path: "/legal/refund-policy",
  },
  docs: {
    title: "Documentation",
    description:
      "convaudit docs: quick start, score explanations, AI Generator guides, and API-ready workflows to audit and optimize product pages.",
    path: "/docs",
    keywords: ["convaudit docs", "audit documentation", "GEO scoring guide"],
  },
  affiliate: {
    title: "Affiliate Program",
    description:
      "Join the convaudit affiliate program. Earn recurring commissions by referring e-commerce brands to AI-powered product page audits.",
    path: "/affiliate",
    keywords: ["convaudit affiliate", "SaaS affiliate program", "e-commerce tool referral"],
  },
  auth: {
    title: "Sign In",
    description: "Sign in or create your convaudit account to run AI product page audits.",
    path: "/auth",
  },
} as const;
