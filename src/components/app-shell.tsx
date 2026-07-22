"use client";

import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/common/visual-effects";
import { Hero } from "@/components/sections/hero";
import { LogosStrip } from "@/components/sections/logos-strip";
import { MetricsBand } from "@/components/sections/metrics-band";

function SectionSkeleton() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded-full bg-muted" />
          <div className="h-10 w-2/3 rounded-lg bg-muted" />
          <div className="h-10 w-1/2 rounded-lg bg-muted" />
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ConceptExplainer = dynamic(
  () => import("@/components/sections/concept-explainer").then((m) => ({ default: m.ConceptExplainer })),
  { loading: () => <SectionSkeleton /> },
);
const Features = dynamic(
  () => import("@/components/sections/features").then((m) => ({ default: m.Features })),
  { loading: () => <SectionSkeleton /> },
);
const MvpCapabilities = dynamic(
  () => import("@/components/sections/mvp-capabilities").then((m) => ({ default: m.MvpCapabilities })),
  { loading: () => <SectionSkeleton /> },
);
const HowItWorks = dynamic(
  () => import("@/components/sections/how-it-works").then((m) => ({ default: m.HowItWorks })),
  { loading: () => <SectionSkeleton /> },
);
const ScoreShowcase = dynamic(
  () => import("@/components/sections/score-showcase").then((m) => ({ default: m.ScoreShowcase })),
  { loading: () => <SectionSkeleton /> },
);
const ComparisonTable = dynamic(
  () => import("@/components/sections/comparison-table").then((m) => ({ default: m.ComparisonTable })),
  { loading: () => <SectionSkeleton /> },
);
const ComparisonDemo = dynamic(
  () => import("@/components/sections/comparison-demo").then((m) => ({ default: m.ComparisonDemo })),
  { loading: () => <SectionSkeleton /> },
);
const SecurityBand = dynamic(
  () => import("@/components/sections/security-band").then((m) => ({ default: m.SecurityBand })),
  { loading: () => <SectionSkeleton /> },
);
const Pricing = dynamic(
  () => import("@/components/sections/pricing").then((m) => ({ default: m.Pricing })),
  { loading: () => <SectionSkeleton /> },
);
const Testimonials = dynamic(
  () => import("@/components/sections/testimonials").then((m) => ({ default: m.Testimonials })),
  { loading: () => <SectionSkeleton /> },
);
const FAQ = dynamic(
  () => import("@/components/sections/faq").then((m) => ({ default: m.FAQ })),
  { loading: () => <SectionSkeleton /> },
);
const CTA = dynamic(
  () => import("@/components/sections/cta").then((m) => ({ default: m.CTA })),
  { loading: () => <SectionSkeleton /> },
);

/** Marketing landing page — product flows live in App Router routes. */
export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 flex flex-col pt-16">
        <Hero />
        <LogosStrip />
        <MetricsBand />
        <ConceptExplainer />
        <Features />
        <MvpCapabilities />
        <HowItWorks />
        <ScoreShowcase />
        <ComparisonTable />
        <ComparisonDemo />
        <SecurityBand />
        <Pricing />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
