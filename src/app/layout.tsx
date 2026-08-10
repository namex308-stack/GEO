import type { Metadata, Viewport } from "next";
import { Cairo, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getLocaleConfig } from "@/lib/locale/config";
import { getActiveLocaleId } from "@/lib/locale/resolve";
import { getSiteUrl } from "@/lib/site-url";
import {
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_OG_TITLE,
} from "@/lib/seo/site-copy";
import { Analytics } from "@vercel/analytics/next";

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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_DEFAULT_TITLE,
    template: "%s · ConvAudit",
  },
  description: SITE_DESCRIPTION,
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
  // Canonical / OG url are set per public page so private routes do not inherit "/".
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
    title: SITE_OG_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "ConvAudit",
    type: "website",
    locale: getLocaleConfig(getActiveLocaleId()).ogLocale,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_OG_TITLE,
    description: SITE_DESCRIPTION,
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

  return (
    <html lang={locale.htmlLang} dir={locale.dir} suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            {children}
            <SonnerToaster position="top-center" richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
