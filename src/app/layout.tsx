import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "StorePulse AI — AI-Powered E-commerce Audit & Optimization",
    template: "%s · StorePulse AI",
  },
  description:
    "Audit any store or product page in 60 seconds. Get AI-powered scores for conversion, SEO, GEO visibility, and trust — benchmarked against competitors. Built for Shopify, WooCommerce, Salla & Zid stores.",
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
  authors: [{ name: "StorePulse AI" }],
  creator: "StorePulse AI",
  publisher: "StorePulse AI",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "StorePulse AI — AI-Powered E-commerce Intelligence",
    description:
      "Turn your product page into a conversion machine. AI-powered audits across conversion, SEO, GEO & trust.",
    siteName: "StorePulse AI",
    type: "website",
    locale: "en_US",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "StorePulse AI",
    description: "AI-powered e-commerce audit & optimization platform.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
  applicationName: "StorePulse AI",
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StorePulse",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1f21" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "StorePulse AI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered e-commerce audit platform that analyzes any store or product page and scores it across conversion, SEO, GEO AI visibility and trust — with ready-to-paste AI-generated fixes.",
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Starter" },
      { "@type": "Offer", price: "29", priceCurrency: "USD", name: "Pro" },
      { "@type": "Offer", price: "79", priceCurrency: "USD", name: "Business" },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "1200",
    },
    featureList: [
      "Conversion scoring",
      "SEO scoring",
      "GEO / AI Visibility scoring for ChatGPT, Perplexity & Google AI",
      "Trust scoring",
      "Competitor benchmarking",
      "AI Generator (titles, descriptions, FAQ, meta, ad copy)",
    ],
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

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
