import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "StorePulse AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1d1f21 0%, #2a2d30 100%)",
          fontFamily: "system-ui, sans-serif",
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
          S
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, color: "white", lineHeight: 1.1, display: "flex" }}>
          StorePulse AI
        </div>
        <div style={{ fontSize: 24, color: "#929292", marginTop: 16, display: "flex" }}>
          AI-Powered E-commerce Audit &amp; Optimization
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
          Start Free Audit
        </div>
      </div>
    ),
    { ...size }
  );
}
