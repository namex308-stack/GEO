"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/common/visual-effects";
import { ViewMetadata } from "@/components/seo/view-metadata";
import { Hero } from "@/components/sections/hero";
import { LogosStrip } from "@/components/sections/logos-strip";
import { MetricsBand } from "@/components/sections/metrics-band";
import { ConceptExplainer } from "@/components/sections/concept-explainer";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";

// Lazy-load below-fold sections to reduce initial JS bundle (PageSpeed 90+).
// Each section streams in as the user scrolls toward it.
const ScoreShowcase = dynamic(() => import("@/components/sections/score-showcase").then(m => ({ default: m.ScoreShowcase })), { loading: () => <SectionSkeleton /> });
const ComparisonTable = dynamic(() => import("@/components/sections/comparison-table").then(m => ({ default: m.ComparisonTable })), { loading: () => <SectionSkeleton /> });
const ComparisonDemo = dynamic(() => import("@/components/sections/comparison-demo").then(m => ({ default: m.ComparisonDemo })), { loading: () => <SectionSkeleton /> });
const SecurityBand = dynamic(() => import("@/components/sections/security-band").then(m => ({ default: m.SecurityBand })), { loading: () => <SectionSkeleton /> });
const Pricing = dynamic(() => import("@/components/sections/pricing").then(m => ({ default: m.Pricing })), { loading: () => <SectionSkeleton /> });
const Testimonials = dynamic(() => import("@/components/sections/testimonials").then(m => ({ default: m.Testimonials })), { loading: () => <SectionSkeleton /> });
// FAQ uses Radix Accordion — render client-only to avoid SSR hydration ID mismatch.
// FAQ content is still SEO-indexable via the JSON-LD FAQPage schema in layout.tsx.
const FAQ = dynamic(() => import("@/components/sections/faq").then(m => ({ default: m.FAQ })), { ssr: false, loading: () => <SectionSkeleton /> });
const CTA = dynamic(() => import("@/components/sections/cta").then(m => ({ default: m.CTA })), { loading: () => <SectionSkeleton /> });

// Other views (lazy + client-only — they use Radix Tabs/Accordion/Dialog which
// generate IDs that can mismatch between SSR and client hydration).
const LoginPage = dynamic(() => import("@/components/auth/login-page").then(m => ({ default: m.LoginPage })), { ssr: false });
const AuditQuiz = dynamic(() => import("@/components/audit/audit-quiz").then(m => ({ default: m.AuditQuiz })), { ssr: false });
const OnboardingQuiz = dynamic(() => import("@/components/audit/onboarding-quiz").then(m => ({ default: m.OnboardingQuiz })), { ssr: false });
const AuditResults = dynamic(() => import("@/components/audit/audit-results").then(m => ({ default: m.AuditResults })), { ssr: false });
const Dashboard = dynamic(() => import("@/components/dashboard/dashboard").then(m => ({ default: m.Dashboard })), { ssr: false });

function SectionSkeleton() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded-full bg-muted" />
          <div className="h-10 w-2/3 rounded-lg bg-muted" />
          <div className="h-10 w-1/2 rounded-lg bg-muted" />
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-muted" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppShell() {
  const { view } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ViewMetadata />
      <ScrollProgress />
      <Navbar />

      <main className="flex-1 flex flex-col pt-16">
        <AnimatePresence mode="wait">
          {view === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Hero />
              <LogosStrip />
              <MetricsBand />
              <ConceptExplainer />
              <Features />
              <HowItWorks />
              <ScoreShowcase />
              <ComparisonTable />
              <ComparisonDemo />
              <SecurityBand />
              <Pricing />
              <Testimonials />
              <FAQ />
              <CTA />
            </motion.div>
          )}

          {view === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <LoginPage />
            </motion.div>
          )}

          {view === "audit" && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <AuditQuiz />
            </motion.div>
          )}

          {view === "onboarding" && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <OnboardingQuiz />
            </motion.div>
          )}

          {view === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <AuditResults />
            </motion.div>
          )}

          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard />
            </motion.div>
          )}

          {view === "pricing" && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <PricingHeader />
              <Pricing />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

function PricingHeader() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-12 pb-2 text-center">
      <span className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</span>
      <h1 className="mt-3 font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-balance">
        Plans that pay for themselves on the first audit.
      </h1>
      <p className="mt-4 text-lg text-muted-foreground text-pretty">
        Start free. Upgrade when you're ready. Billed in USD via Paddle — global cards, Apple Pay &amp; PayPal.
      </p>
    </div>
  );
}
