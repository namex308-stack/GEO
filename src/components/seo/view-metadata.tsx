"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import type { View } from "@/lib/types";

const META: Record<View, { title: string; description: string }> = {
  landing: {
    title: "StorePulse AI — AI-Powered E-commerce Audit & Optimization",
    description:
      "Audit any store or product page in 60 seconds. Get AI-powered scores for conversion, SEO, GEO visibility, and trust — benchmarked against competitors.",
  },
  login: {
    title: "Sign in · StorePulse AI",
    description: "Sign in to StorePulse AI to audit your store, track competitors, and grow with AI-powered insights.",
  },
  onboarding: {
    title: "Set up your audit · StorePulse AI",
    description: "Tell us about your store so we can tailor your audit to your platform, challenge and audience.",
  },
  audit: {
    title: "Run your audit · StorePulse AI",
    description: "Paste your product URL and get an AI-powered audit in 60 seconds.",
  },
  results: {
    title: "Your audit results · StorePulse AI",
    description: "Your Store Score, competitor comparison, AI recommendations and ready-to-paste copy fixes.",
  },
  dashboard: {
    title: "Dashboard · StorePulse AI",
    description: "Track your store performance, score trends and recent audits.",
  },
  pricing: {
    title: "Pricing · StorePulse AI",
    description: "Plans that pay for themselves on the first audit. Start free. Billed in USD via Paddle.",
  },
};

/**
 * Updates document.title and meta description when the view changes.
 * Since this is a single-page app with client-side view switching, this keeps
 * the browser tab and any share previews accurate per screen.
 */
export function ViewMetadata() {
  const view = useAppStore((s) => s.view);

  React.useEffect(() => {
    const meta = META[view] ?? META.landing;
    document.title = meta.title;

    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute("content", meta.description);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", meta.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", meta.description);
  }, [view]);

  return null;
}
