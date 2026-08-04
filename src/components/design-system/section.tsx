import * as React from "react";
import { cn } from "@/lib/utils";
import { BlurFade } from "@/components/magicui/blur-fade";

export function Container({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Section({
  className,
  tone = "default",
  children,
  ...props
}: React.ComponentProps<"section"> & {
  tone?: "default" | "muted" | "bordered";
}) {
  return (
    <section
      className={cn(
        "py-20 sm:py-24 lg:py-28",
        tone === "muted" && "bg-muted/30 border-y border-border/50",
        tone === "bordered" && "border-y border-border/50",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  delay = 0,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  delay?: number;
}) {
  return (
    <BlurFade delay={delay} className={cn(align === "center" && "text-center mx-auto", "max-w-2xl", className)}>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-balance text-foreground",
          eyebrow ? "mt-3" : undefined
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed text-pretty">
          {description}
        </p>
      ) : null}
    </BlurFade>
  );
}

export function SurfaceCard({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-border/60 bg-card p-6 shadow-[var(--shadow-card)] transition-[box-shadow,border-color] duration-200",
        "hover:border-border hover:shadow-[var(--shadow-card-hover)]",
        "focus-within:ring-2 focus-within:ring-ring/40",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
