import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/common/visual-effects";
import { Hero } from "@/components/sections/hero";
import { LogosStrip } from "@/components/sections/logos-strip";
import { WhyLoseSales } from "@/components/sections/why-lose-sales";
import { ConceptExplainer } from "@/components/sections/concept-explainer";
import { ProductPreview } from "@/components/sections/product-preview";
import { Features } from "@/components/sections/features";
import { DecisionEngine } from "@/components/sections/decision-engine";
import { Skeleton } from "@/components/ui/skeleton";

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
