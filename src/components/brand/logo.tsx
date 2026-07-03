"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: number;
}

export function Logo({ className, showWordmark = true, size = 36 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sp-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF6600" />
            <stop offset="0.55" stopColor="#cc5200" />
            <stop offset="1" stopColor="#cc5200" />
          </linearGradient>
          <linearGradient id="sp-gold" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffa1" />
            <stop offset="1" stopColor="#ff983f" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="13" fill="url(#sp-grad)" />
        <circle cx="24" cy="24" r="15" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
        <circle cx="24" cy="24" r="10" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
        <path
          d="M9 24.5 H17 L19.5 18 L23 31 L26 24.5 H39"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="39" cy="24.5" r="3.4" fill="url(#sp-gold)" />
        <circle cx="39" cy="24.5" r="3.4" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      </svg>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="font-display font-extrabold text-[17px] tracking-tight text-foreground">
            StorePulse
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            AI Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
