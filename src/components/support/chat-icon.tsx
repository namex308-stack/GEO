"use client";

import { cn } from "@/lib/utils";

type ChatIconProps = {
  className?: string;
  size?: number;
};

/** Branded assistant avatar — gradient ring + sparkle bot face. */
export function ChatIcon({ className, size = 28 }: ChatIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="chat-icon-grad" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff983f" />
          <stop offset="1" stopColor="#cc5200" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="14" fill="url(#chat-icon-grad)" />
      <rect x="7" y="7" width="34" height="34" rx="12" fill="white" fillOpacity="0.12" />
      <circle cx="18" cy="22" r="3" fill="white" />
      <circle cx="30" cy="22" r="3" fill="white" />
      <path
        d="M17 30c2.5 2.5 11.5 2.5 14 0"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M24 8l1.2 3.6H29l-3 2.2 1.1 3.5L24 14.8 20.9 17.3 22 14l-3-2.2h3.8L24 8z"
        fill="white"
        fillOpacity="0.95"
      />
      <circle cx="38" cy="12" r="2" fill="#fff7ed" fillOpacity="0.9" />
      <circle cx="10" cy="36" r="1.5" fill="#fff7ed" fillOpacity="0.7" />
    </svg>
  );
}
