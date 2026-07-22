"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  ctaLabel,
  ctaHref,
  className,
}: {
  title: string;
  ctaLabel: string;
  ctaHref: string;
  className?: string;
}) {
  return (
    <div className={cn("text-center py-20", className)}>
      <p className="text-muted-foreground mb-4">{title}</p>
      <Button asChild className="rounded-full">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
