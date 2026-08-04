"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreRadialProps {
  score: number;
  max?: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  animate?: boolean;
  gold?: boolean;
}

function scoreColor(score: number, max: number, gold?: boolean) {
  const pct = (score / max) * 100;
  if (gold) return "#ff983f";
  if (pct >= 80) return "#FF6600"; // primary orange
  if (pct >= 65) return "#ff983f"; // lighter orange
  if (pct >= 50) return "#929292"; // gray
  return "#444648"; // dark gray for low
}

export function ScoreRadial({
  score,
  max = 100,
  size = 140,
  stroke = 10,
  label,
  sublabel,
  className,
  animate = true,
  gold = false,
}: ScoreRadialProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / max, 1);
  const offset = circumference * (1 - pct);
  const color = scoreColor(score, max, gold);
  const center = size / 2;

  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/60"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animate ? { strokeDashoffset: circumference } : false}
          whileInView={animate ? { strokeDashoffset: offset } : undefined}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display font-extrabold leading-none" style={{ fontSize: size * 0.28, color }}>
            {score}
          </div>
          {label && (
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
              {label}
            </div>
          )}
          {sublabel && (
            <div className="text-[9px] text-muted-foreground/70 mt-0.5">{sublabel}</div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ScoreBarProps {
  score: number;
  max?: number;
  label: string;
  value?: string;
  delay?: number;
}

export function ScoreBar({ score, max = 100, label, value, delay = 0 }: ScoreBarProps) {
  const pct = (score / max) * 100;
  const color = scoreColor(score, max);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {value ?? `${score}/${max}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
        />
      </div>
    </div>
  );
}
