import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
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
  // Security & performance headers
  async headers() {
    return [
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
      {
        // Static assets — long cache
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
