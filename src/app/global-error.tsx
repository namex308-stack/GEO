"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[convaudit] Global error:", error);
  }, [error]);

  return (
    <html lang="en">
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
          <div style={{ maxWidth: "440px", textAlign: "center" }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>
              Application error
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "#929292",
                margin: "0 0 24px",
                lineHeight: 1.5,
              }}
            >
              A critical error occurred and the application needs to restart.
              Your data is safe — try reloading.
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
                ID: {error.digest}
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
              }}
            >
              Reload application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
