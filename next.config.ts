import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is dev-only: Turbopack's HMR client needs it for module
      // reloading. Production bundles never call eval(), so it's dropped there.
      `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data:",
      "img-src 'self' data: https:",
      "connect-src 'self' https:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    minimumCacheTTL: 60 * 60 * 24,
  },
  compress: true,
  async headers() {
    const headers = [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];

    // Immutable static caching is production-only. In `next dev`, Turbopack HMR
    // rewrites chunks frequently; long-lived Cache-Control causes stale lucide
    // (and other) module factories in the browser.
    if (isProd) {
      headers.push({
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      });
    } else {
      headers.push({
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      });
    }

    return headers;
  },
};

export default nextConfig;
