import type { Metadata, Viewport } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getLocaleConfig } from "@/lib/locale/config";
import { getActiveLocaleId } from "@/lib/locale/resolve";

/** Arabic-first typeface (Latin fallback for brand name, URLs, code). */
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "ConvAudit — تحليل وتحسين متاجر التجارة الإلكترونية بالذكاء الاصطناعي",
    template: "%s · ConvAudit",
  },
  description:
    "حلّل أي متجر أو صفحة منتج في 60 ثانية. احصل على تقييم بالذكاء الاصطناعي للتحويل، SEO، الظهور في محركات الذكاء الاصطناعي (GEO)، والثقة — مع مقارنة بالمنافسين. يدعم Shopify وWooCommerce وسلة وزد.",
  keywords: [
    "تحليل متجر إلكتروني",
    "تحسين صفحة المنتج",
    "تحسين معدل التحويل",
    "GEO SEO",
    "تحليل متجر بالذكاء الاصطناعي",
    "تحليل Shopify",
    "سلة",
    "زد",
    "تحليل WooCommerce",
  ],
  authors: [{ name: "ConvAudit" }],
  creator: "ConvAudit",
  publisher: "ConvAudit",
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
    title: "ConvAudit — ذكاء اصطناعي لتحليل التجارة الإلكترونية",
    description:
      "حوّل صفحة منتجك إلى آلة تحويل. تحليل بالذكاء الاصطناعي للتحويل، SEO، GEO والثقة.",
    siteName: "ConvAudit",
    type: "website",
    locale: "ar_EG",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "ConvAudit",
    description: "منصة تحليل وتحسين التجارة الإلكترونية بالذكاء الاصطناعي.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "technology",
  applicationName: "ConvAudit",
  formatDetection: { telephone: false, email: false, address: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ConvAudit",
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
  const locale = getLocaleConfig(getActiveLocaleId());

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ConvAudit",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "منصة تحليل تجارة إلكترونية بالذكاء الاصطناعي تحلل أي متجر أو صفحة منتج وتقيّمه في التحويل، SEO، الظهور في محركات الذكاء الاصطناعي (GEO) والثقة — مع إصلاحات جاهزة للنشر.",
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "USD", name: "مجاني" },
      { "@type": "Offer", price: "29", priceCurrency: "USD", name: "احترافي" },
      { "@type": "Offer", price: "79", priceCurrency: "USD", name: "أعمال" },
    ],
    featureList: [
      "تقييم التحويل",
      "تقييم SEO",
      "تقييم الظهور في ChatGPT وPerplexity وGoogle AI",
      "تقييم الثقة",
      "مقارنة بالمنافسين",
      "مولّد ذكاء اصطناعي (عناوين، أوصاف، أسئلة شائعة، Meta، نصوص إعلانية)",
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "كيف يعمل التحليل بالذكاء الاصطناعي؟",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ألصق رابط صفحة المنتج ويقرأ Firecrawl الصفحة كاملة كما تُعرض. ثم يقيّمها Gemini في التحويل، SEO، الظهور في GEO والثقة، ويقارنها بمنافسك، ويولّد توصيات مرتبة بالأولوية مع نصوص جاهزة للنشر.",
        },
      },
      {
        "@type": "Question",
        name: "ما هو تقييم GEO / الظهور بالذكاء الاصطناعي؟",
        acceptedAnswer: {
          "@type": "Answer",
          text: "يقيس GEO (تحسين محركات الذكاء التوليدي) ما إذا كانت مساعدات الذكاء الاصطناعي مثل ChatGPT وPerplexity وGoogle AI قادرة على فهم صفحتك وقد توصي بمنتجك.",
        },
      },
      {
        "@type": "Question",
        name: "ما المنصات المدعومة؟",
        acceptedAnswer: {
          "@type": "Answer",
          text: "أي صفحة منتج عامة تعمل — Shopify, WooCommerce, سلة, زد, Magento, Wix, والمتاجر المخصصة وصفحات الأفلييت.",
        },
      },
    ],
  };

  return (
    <html lang={locale.htmlLang} dir={locale.dir} suppressHydrationWarning>
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
        className={`${cairo.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-center" richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
