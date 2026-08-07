import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: getSiteUrl(),
    name: "ConvAudit — منصة تحليل التجارة الإلكترونية",
    short_name: "ConvAudit",
    description:
      "منصة تحليل تجارة إلكترونية بالذكاء الاصطناعي. قيّم صفحات منتجاتك في التحويل، SEO، الظهور في GEO والثقة.",
    lang: "ar",
    dir: "rtl",
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
  };
}
