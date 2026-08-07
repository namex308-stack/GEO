"use client";

import * as React from "react";

/**
 * Root-layout failure boundary. Must stay self-contained — when this renders,
 * the root layout (providers, fonts, Tailwind) may have already crashed, so we
 * avoid shared UI / i18n imports and use inline styles + hardcoded Arabic copy
 * that matches `globalError.*` message keys.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[ConvAudit] Global error:", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          background: "#1d1f21",
          color: "#f5f5f5",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: 440, textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 18,
                background: "rgba(244,63,94,0.1)",
                color: "#f43f5e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 28,
                lineHeight: 1,
              }}
              aria-hidden
            >
              !
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>
              خطأ في التطبيق
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#929292",
                margin: "0 0 24px",
                lineHeight: 1.5,
              }}
            >
              حدث خطأ حرج ويحتاج التطبيق لإعادة التشغيل. بياناتك بأمان — حاول إعادة التحميل.
            </p>
            {error.digest && (
              <p
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "rgba(146,146,146,0.7)",
                  marginBottom: 16,
                }}
              >
                رقم الخطأ: {error.digest}
              </p>
            )}
            <button
              type="button"
              onClick={reset}
              style={{
                borderRadius: 999,
                background: "#FF6600",
                color: "white",
                border: "none",
                padding: "10px 24px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
