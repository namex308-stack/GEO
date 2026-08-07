import { Logo } from "@/components/brand/logo";
import { translate as t } from "@/lib/i18n";

/**
 * Shared App Router loading UI — used by `app/loading.tsx` and every major
 * section's `loading.tsx`. Matches the existing root loader exactly.
 */
export default function RouteLoading() {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Logo showWordmark={false} size={48} />
          <span className="absolute -inset-3 rounded-2xl border-2 border-primary/30 animate-pulse-ring" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="size-2 rounded-full bg-primary animate-bounce" />
        </div>
        <p className="text-sm text-muted-foreground">{t("common.loadingConvAudit")}</p>
      </div>
    </div>
  );
}
