import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/common/visual-effects";
import { Hero } from "@/components/sections/hero";
import { LogosStrip } from "@/components/sections/logos-strip";
import { Skeleton } from "@/components/ui/skeleton";
import { JsonLd } from "@/components/seo/json-ld";
import { publicPageMetadata } from "@/lib/seo/page-metadata";
import { buildHomeJsonLdGraph } from "@/lib/seo/structured-data";
import {
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_OG_TITLE,
} from "@/lib/seo/site-copy";
import { ROUTES } from "@/lib/routes";

const homeMeta = publicPageMetadata({
  title: SITE_OG_TITLE,
  description: SITE_DESCRIPTION,
  path: ROUTES.home,
});

export const metadata: Metadata = {
  ...homeMeta,
  // Keep the historical homepage <title> (do not apply root `%s · ConvAudit` template).
  title: { absolute: SITE_DEFAULT_TITLE },
  openGraph: {
    ...homeMeta.openGraph,
    title: SITE_OG_TITLE,
  },
  twitter: {
    ...homeMeta.twitter,
    title: SITE_OG_TITLE,
  },
};

function SectionSkeleton() {
  return (
    <div className="py-20 sm:py-24" aria-hidden>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-10 w-2/3 max-w-xl rounded-lg" />
        <Skeleton className="h-6 w-1/2 max-w-md rounded-lg" />
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

const WhyLoseSales = dynamic(
  () => import("@/components/sections/why-lose-sales").then((m) => ({ default: m.WhyLoseSales })),
  { loading: () => <SectionSkeleton /> }
);
const ConceptExplainer = dynamic(
  () => import("@/components/sections/concept-explainer").then((m) => ({ default: m.ConceptExplainer })),
  { loading: () => <SectionSkeleton /> }
);
const ProductPreview = dynamic(
  () => import("@/components/sections/product-preview").then((m) => ({ default: m.ProductPreview })),
  { loading: () => <SectionSkeleton /> }
);
const Features = dynamic(
  () => import("@/components/sections/features").then((m) => ({ default: m.Features })),
  { loading: () => <SectionSkeleton /> }
);
const DecisionEngine = dynamic(
  () => import("@/components/sections/decision-engine").then((m) => ({ default: m.DecisionEngine })),
  { loading: () => <SectionSkeleton /> }
);
const ComparisonTable = dynamic(
  () => import("@/components/sections/comparison-table").then((m) => ({ default: m.ComparisonTable })),
  { loading: () => <SectionSkeleton /> }
);
const Pricing = dynamic(
  () => import("@/components/sections/pricing").then((m) => ({ default: m.Pricing })),
  { loading: () => <SectionSkeleton /> }
);
const Methodology = dynamic(
  () => import("@/components/sections/methodology").then((m) => ({ default: m.Methodology })),
  { loading: () => <SectionSkeleton /> }
);
const SecurityBand = dynamic(
  () => import("@/components/sections/security-band").then((m) => ({ default: m.SecurityBand })),
  { loading: () => <SectionSkeleton /> }
);
const TrustResources = dynamic(
  () => import("@/components/sections/trust-resources").then((m) => ({ default: m.TrustResources })),
  { loading: () => <SectionSkeleton /> }
);
const FAQ = dynamic(
  () => import("@/components/sections/faq").then((m) => ({ default: m.FAQ })),
  { loading: () => <SectionSkeleton /> }
);
const CTA = dynamic(
  () => import("@/components/sections/cta").then((m) => ({ default: m.CTA })),
  { loading: () => <SectionSkeleton /> }
);

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLd data={buildHomeJsonLdGraph()} />
      <ScrollProgress />
      <Navbar />
      <main className="flex-1 flex flex-col pt-16">
        <Hero />
        <LogosStrip />
        <WhyLoseSales />
        <ConceptExplainer />
        <ProductPreview />
        <Features />
        <DecisionEngine />
        <ComparisonTable />
        <Pricing />
        <Methodology />
        <SecurityBand />
        <TrustResources />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
