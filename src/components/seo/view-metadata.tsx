"use client";

import * as React from "react";

const LANDING_META = {
  title: "convaudit — AI-Powered E-commerce Audit & Optimization",
  description:
    "Audit any store or product page in 60 seconds. Get AI-powered scores for conversion, SEO, GEO visibility, and trust — benchmarked against competitors.",
};

/** Keeps document title and meta description accurate on the marketing landing page. */
export function ViewMetadata() {
  React.useEffect(() => {
    document.title = LANDING_META.title;

    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute("content", LANDING_META.description);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", LANDING_META.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", LANDING_META.description);
  }, []);

  return null;
}
