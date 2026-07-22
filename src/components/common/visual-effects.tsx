"use client";

import * as React from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useMounted } from "@/hooks/use-mounted";

/* ============================================================
   FloatingOrbs — ambient gradient blobs that drift slowly
   ============================================================ */
export function FloatingOrbs({
  className,
  count = 3,
}: {
  className?: string;
  count?: number;
}) {
  const orbs = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        size: 280 + i * 120,
        top: `${[10, 40, 65][i % 3]}%`,
        left: `${[5, 70, 35][i % 3]}%`,
        delay: i * 1.4,
        duration: 14 + i * 4,
        hue: i % 2 === 0 ? "oklch(0.68 0.19 55)" : "oklch(0.77 0.16 58)",
      })),
    [count]
  );
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden -z-10 ${className ?? ""}`} aria-hidden>
      {orbs.map((o) => (
        <motion.div
          key={o.id}
          className="absolute rounded-full blur-[100px] opacity-[0.18]"
          style={{
            width: o.size,
            height: o.size,
            top: o.top,
            left: o.left,
            background: o.hue,
          }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -50, 20, 0],
            scale: [1, 1.12, 0.95, 1],
          }}
          transition={{
            duration: o.duration,
            delay: o.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   ParticleField — subtle floating dots
   ============================================================ */
/** Deterministic 0–1 value so SSR and client hydration match. */
function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function generateDots(count: number) {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: seededUnit(i * 5 + 1) * 100,
    y: seededUnit(i * 5 + 2) * 100,
    size: 1 + seededUnit(i * 5 + 3) * 2.5,
    duration: 8 + seededUnit(i * 5 + 4) * 10,
    delay: seededUnit(i * 5 + 5) * 5,
  }));
}

export function ParticleField({ count = 24, className }: { count?: number; className?: string }) {
  const mounted = useMounted();
  const dots = React.useMemo(() => generateDots(count), [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden -z-10 ${className ?? ""}`} aria-hidden>
      {mounted
        ? dots.map((d) => (
            <motion.span
              key={d.id}
              className="absolute rounded-full bg-primary/40"
              style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: d.duration, delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))
        : null}
    </div>
  );
}

/* ============================================================
   ScrollProgress — top-of-page reading progress bar
   ============================================================ */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] gradient-brand origin-left z-[60]"
      style={{ scaleX }}
      aria-hidden
    />
  );
}

/* ============================================================
   Reveal — scroll-triggered fade/slide in
   ============================================================ */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  once = true,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   MagneticGlow — a card wrapper that follows the cursor with a glow
   ============================================================ */
export function MagneticGlow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: 50, y: 50 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`group relative overflow-hidden ${className ?? ""}`}
    >
      <div
        className="pointer-events-none absolute -in-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(400px circle at ${pos.x}% ${pos.y}%, oklch(0.68 0.19 55 / 0.12), transparent 60%)`,
        }}
      />
      {children}
    </div>
  );
}

/* ============================================================
   AnimatedCounter — re-export of count-up hook as a component
   ============================================================ */
export { useCountUp, formatNumber } from "@/hooks/use-count-up";
