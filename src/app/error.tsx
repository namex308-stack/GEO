"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[convaudit] Unhandled error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 4rem)",
        display: "grid",
        placeItems: "center",
        padding: "4rem 1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "28rem", width: "100%", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#929292", margin: "0 0 1.5rem", lineHeight: 1.5 }}>
          An unexpected error occurred while rendering this page. You can try again or go back home.
        </p>

        {error.digest && (
          <p
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              color: "rgba(146,146,146,0.7)",
              marginBottom: "1rem",
            }}
          >
            Error ID: {error.digest}
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              borderRadius: 999,
              background: "#FF6600",
              color: "white",
              border: "none",
              padding: "0.5rem 1.25rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              borderRadius: 999,
              background: "transparent",
              color: "inherit",
              border: "1px solid rgba(146,146,146,0.4)",
              padding: "0.5rem 1.25rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
