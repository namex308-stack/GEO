import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://convaudit.ai";
  return {
    name: "convaudit — E-commerce Audit Platform",
    short_name: "convaudit",
    description:
      "AI-powered e-commerce audit platform. Score your product pages across conversion, SEO, GEO visibility & trust.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#FF6600",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "shopping"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    related_applications: [],
  };
}
