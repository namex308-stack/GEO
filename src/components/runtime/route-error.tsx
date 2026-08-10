"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw, Home, Bug } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { translate as t } from "@/lib/locale/t";

type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Shared App Router error UI — used by `app/error.tsx` and every major
 * section's `error.tsx`. Preserves the existing root-boundary look so
 * segment boundaries stay visually consistent without redesign.
 */
export default function RouteError({ error, reset }: RouteErrorProps) {
  React.useEffect(() => {
    console.error("[ConvAudit] Unhandled error:", error);
  }, [error]);

  return (
    <>
      {/* error.tsx cannot export metadata — emit robots tags in the boundary UI. */}
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Logo showWordmark={false} size={56} />
              <span className="absolute -inset-2 rounded-2xl bg-rose-500/10 -z-10" />
            </div>
          </div>

          <div className="size-14 rounded-2xl bg-rose-500/10 text-rose-500 grid place-items-center mx-auto mb-5">
            <AlertTriangle className="size-7" />
          </div>

          <h1 className="font-display text-2xl font-bold">{t("error.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">{t("error.desc")}</p>

          {error.digest && (
            <p className="mt-3 text-[11px] font-mono text-muted-foreground/70">
              {t("error.errorId")}: {error.digest}
            </p>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={reset} className="rounded-full">
              <RotateCcw className="size-4 me-1.5" /> {t("error.tryAgain")}
            </Button>
            <Button variant="outline" asChild className="rounded-full">
              <a href="/">
                <Home className="size-4 me-1.5" /> {t("error.goHome")}
              </a>
            </Button>
          </div>

          {process.env.NODE_ENV !== "production" && (
            <details className="mt-6 text-start">
              <summary className="text-xs text-muted-foreground cursor-pointer inline-flex items-center gap-1 hover:text-foreground">
                <Bug className="size-3" /> {t("error.technicalDetails")}
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-muted text-[11px] font-mono text-muted-foreground overflow-auto max-h-40">
                {error.message}
                {error.stack && "\n\n" + error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    </>
  );
}
