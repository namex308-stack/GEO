"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw, Home, Bug } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log to your error tracking service (Sentry, Logflare, etc.)
    console.error("[StorePulse] Unhandled error:", error);
  }, [error]);

  return (
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

        <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          An unexpected error occurred while rendering this page. Our team has been notified.
          You can try again or go back home.
        </p>

        {error.digest && (
          <p className="mt-3 text-[11px] font-mono text-muted-foreground/70">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={reset} className="rounded-full">
            <RotateCcw className="size-4 mr-1.5" /> Try again
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <a href="/">
              <Home className="size-4 mr-1.5" /> Go home
            </a>
          </Button>
        </div>

        <details className="mt-6 text-left">
          <summary className="text-xs text-muted-foreground cursor-pointer inline-flex items-center gap-1 hover:text-foreground">
            <Bug className="size-3" /> Technical details
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-muted text-[11px] font-mono text-muted-foreground overflow-auto max-h-40">
            {error.message}
            {error.stack && "\n\n" + error.stack}
          </pre>
        </details>
      </div>
    </div>
  );
}
