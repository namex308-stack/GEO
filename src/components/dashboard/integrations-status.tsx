"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Database, Bot, Globe2, CreditCard, Gauge, ShieldCheck,
  Check, AlertTriangle, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  key: string;
  name: string;
  icon: typeof Database;
  configured: boolean;
  missing: string[];
  docs: string;
}

const ICONS: Record<string, typeof Database> = {
  supabase: Database,
  google: ShieldCheck,
  gemini: Bot,
  firecrawl: Globe2,
  kashier: CreditCard,
  redis: Gauge,
};

export function IntegrationsStatus() {
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((data) => {
        setServices(data.services ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || services.length === 0) return null;

  const configuredCount = services.filter((s) => s.configured).length;
  const allDone = configuredCount === services.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/60 bg-card p-6"
    >
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Gauge className="size-5 text-primary" /> Integrations
        </h2>
        <span className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded-full",
          allDone ? "bg-primary/10 text-primary" : "bg-brand/10 text-brand"
        )}>
          {allDone ? "All connected" : `${configuredCount}/${services.length} connected`}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        {allDone
          ? "All backend services are live. Audits use real data."
          : "Running in demo mode. Add the missing keys to .env.local to go live."}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.map((s) => {
          const Icon = ICONS[s.key] ?? Database;
          return (
            <div
              key={s.key}
              className={cn(
                "rounded-xl border p-3.5 flex items-start gap-3",
                s.configured ? "border-primary/30 bg-primary/5" : "border-brand/30 bg-brand/5"
              )}
            >
              <span className={cn(
                "size-9 rounded-lg grid place-items-center shrink-0",
                s.configured ? "bg-primary/15 text-primary" : "bg-brand/15 text-brand"
              )}>
                <Icon className="size-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold">{s.name}</span>
                  {s.configured ? (
                    <Check className="size-3.5 text-primary" />
                  ) : (
                    <AlertTriangle className="size-3.5 text-brand" />
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {s.configured ? "Connected" : `${s.missing.length} key(s) missing`}
                </div>
                {!s.configured && (
                  <a
                    href={s.docs}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    Get keys <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
