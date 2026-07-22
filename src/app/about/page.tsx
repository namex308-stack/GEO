"use client";

import { Building2 } from "lucide-react";
import { ContentPage } from "@/components/marketing/content-page";
import { ABOUT_CONTENT } from "@/lib/marketing/site-pages";

export default function AboutPage() {
  return (
    <ContentPage
      icon={Building2}
      title={ABOUT_CONTENT.title}
      subtitle={ABOUT_CONTENT.subtitle}
      sections={ABOUT_CONTENT.sections}
    />
  );
}
