import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/auth/session-provider";
import { LazyChatWidget } from "@/components/support/lazy-chat-widget";
import { BRAND_NAME, BRAND_URL } from "@/lib/brand";
import { getSiteUrl, PAGE_SEO } from "@/lib/seo";
import { getUser } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: PAGE_SEO.home.title,
    template: `%s · ${BRAND_NAME}`,
  },
  description: PAGE_SEO.home.description,
  keywords: [...PAGE_SEO.home.keywords],
  authors: [{ name: BRAND_NAME, url: BRAND_URL }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: `${BRAND_NAME} — AI-Powered E-commerce Intelligence`,
    description:
      "Turn your product page into a conversion machine. AI-powered audits across conversion, SEO, GEO & trust.",
    siteName: BRAND_NAME,
    type: "website",
    locale: "en_US",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_NAME,
    description: "AI-powered e-commerce audit & optimization platform.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
  applicationName: BRAND_NAME,
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRAND_NAME,
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND_NAME,
    url: siteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: PAGE_SEO.home.description,
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "EGP", name: "Free" },
      { "@type": "Offer", price: "199", priceCurrency: "EGP", name: "Pro" },
      { "@type": "Offer", price: "499", priceCurrency: "EGP", name: "Business" },
    ],
    featureList: [
      "Conversion scoring",
      "SEO scoring",
      "GEO / AI Visibility scoring for ChatGPT, Perplexity & Google AI",
      "Trust scoring",
      "Competitor benchmarking",
      "AI Generator (titles, descriptions, FAQ, meta, ad copy)",
    ],
  };
  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    sameAs: ["https://www.linkedin.com/in/ali-hashem-1044883a8"],
  };

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SessionProvider serverUser={user}>
            {children}
            <LazyChatWidget />
          </SessionProvider>
          <SonnerToaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
