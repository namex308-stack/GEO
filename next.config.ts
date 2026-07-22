import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Ensure Turbopack loads .env.local from this app (not a parent lockfile directory)
  turbopack: {
    root: projectRoot,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_KASHIER_MERCHANT_ID: process.env.NEXT_PUBLIC_KASHIER_MERCHANT_ID,
    NEXT_PUBLIC_KASHIER_MODE: process.env.KASHIER_MODE ?? "test",
  },
  output: "standalone",
  reactStrictMode: false,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow the preview panel origin to access the dev server
  allowedDevOrigins: [
    "preview-chat-4b6e0d1c-6122-46a1-8f31-fb0e2410f2c5.space-z.ai",
    "*.space-z.ai",
    "space-z.ai",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    minimumCacheTTL: 60 * 60 * 24,
  },
  // Compress responses
  compress: true,
  async redirects() {
    return [
      { source: "/onboarding/platform", destination: "/onboarding", permanent: true },
      { source: "/onboarding/store", destination: "/onboarding", permanent: true },
      { source: "/onboarding/goals", destination: "/onboarding", permanent: true },
      { source: "/onboarding/done", destination: "/dashboard", permanent: true },
      { source: "/refund-policy", destination: "/legal/refund-policy", permanent: true },
      { source: "/quiz", destination: "/onboarding", permanent: false },
    ];
  },
  // Security & performance headers
  async headers() {
    const securityHeaders = [
      {
        source: "/(.*)",
        headers: [
          // Security
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data:",
              "img-src 'self' data: https:",
              "connect-src 'self' https:",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          // Performance
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];

    // Long-lived cache for hashed static assets — production only.
    // Applying this in dev breaks Turbopack's React Client Manifest (stale chunks).
    if (process.env.NODE_ENV === "production") {
      securityHeaders.push(
        {
          source: "/_next/static/(.*)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
        {
          source: "/blog/(.*)",
          headers: [
            { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
          ],
        },
        {
          source: "/icon.svg",
          headers: [
            { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
          ],
        },
      );
    }

    return securityHeaders;
  },
};

export default nextConfig;
