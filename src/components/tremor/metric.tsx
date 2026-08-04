"use client";

import { cn } from "@/lib/utils";

/**
 * Tremor-aligned ProgressBar for Tailwind v4 / React 19 environments
 * where @tremor/react peer styling is incomplete. API mirrors Tremor's ProgressBar.
 */
export function ProgressBar({
  value,
  color = "orange",
  className,
}: {
  value: number;
  color?: "orange" | "blue" | "emerald" | "rose" | "amber";
  className?: string;
}) {
  const colors: Record<string, string> = {
    orange: "bg-primary",
    blue: "bg-sky-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
  };

  return (
    <div
      className={cn("h-1.5 w-full rounded-full bg-muted overflow-hidden", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", colors[color])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Metric({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("font-display text-3xl font-bold tracking-tight tabular-nums text-foreground", className)}>
      {children}
    </p>
  );
}
