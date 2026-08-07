import { Skeleton } from "@/components/ui/skeleton";

/** Layout-matching placeholder while /api/dashboard loads — not a redesign. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)]"
          >
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="mt-3 h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-24" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-8 rounded-2xl border border-border/50 bg-card p-5 sm:p-6 shadow-[var(--shadow-card)]">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
          <Skeleton className="mt-6 h-[220px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4 rounded-2xl border border-border/50 bg-card p-5 sm:p-6 shadow-[var(--shadow-card)]">
          <Skeleton className="h-5 w-28" />
          <div className="mt-6 flex flex-col items-center gap-3">
            <Skeleton className="size-[120px] rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-40 rounded-full" />
          </div>
          <div className="mt-6 space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          <Skeleton className="mt-5 h-11 w-full rounded-xl" />
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-8 rounded-2xl border border-border/50 bg-card overflow-hidden shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/50">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <div className="divide-y divide-border/40">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 sm:px-6 py-3.5">
                <Skeleton className="size-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="h-3 w-28 max-w-full" />
                </div>
                <Skeleton className="size-9 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4 sm:space-y-5">
          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)]">
            <Skeleton className="h-5 w-28" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="size-8 rounded-lg shrink-0" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-[var(--shadow-card)]">
            <Skeleton className="h-5 w-28" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HistoryListSkeleton() {
  return (
    <div
      className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/50"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4">
          <Skeleton className="size-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-4 w-44 max-w-full" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="size-8 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}
