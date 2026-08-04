import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const runtime = "edge";
export const alt = "ConvAudit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SUBHEAD = "تحليل وتحسين التجارة الإلكترونية بالذكاء الاصطناعي";
const CTA = "ابدأ تحليلاً مجانياً";
const TWITTER_TEXT = `ConvAudit ${SUBHEAD} ${CTA}`;

export default async function TwitterImage() {
  const cairoFont = await loadGoogleFont("Cairo", TWITTER_TEXT, 800).catch(() => null);

  return new ImageResponse(
    (
      <div
        dir="rtl"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1d1f21 0%, #2a2d30 100%)",
          fontFamily: cairoFont ? "Cairo" : "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 22,
            background: "linear-gradient(135deg, #FF6600, #ff983f)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            fontWeight: 800,
            color: "white",
            marginBottom: 32,
          }}
        >
          C
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, color: "white", lineHeight: 1.1, display: "flex" }}>
          ConvAudit
        </div>
        <div style={{ fontSize: 24, color: "#929292", marginTop: 16, display: "flex" }}>
          {SUBHEAD}
        </div>
        <div
          style={{
            marginTop: 40,
            padding: "14px 32px",
            borderRadius: 999,
            background: "linear-gradient(135deg, #FF6600, #ff983f)",
            fontSize: 20,
            fontWeight: 700,
            color: "white",
            display: "flex",
          }}
        >
          {CTA}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: cairoFont ? [{ name: "Cairo", data: cairoFont, weight: 800, style: "normal" }] : undefined,
    }
  );
}
