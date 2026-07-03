"use client";

import { motion } from "framer-motion";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Zap, Plus, Crown, TrendingUp, ArrowUpRight, Bot, Search,
  ShieldCheck, Clock, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRadial } from "@/components/common/score-viz";
import { IntegrationsStatus } from "@/components/dashboard/integrations-status";
import { useAppStore } from "@/lib/store";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { cn } from "@/lib/utils";

const TREND = [
  { m: "May", score: 64 },
  { m: "Jun", score: 68 },
  { m: "Jul", score: 71 },
  { m: "Aug", score: 75 },
  { m: "Sep", score: 79 },
  { m: "Oct", score: 82 },
];

const RECENT = [
  { name: "Pure Argan Glow Serum 30ml", store: "ArganBloom", score: 82, date: "Today, 14:22", delta: 8 },
  { name: "Rosewater Toner 200ml", store: "ArganBloom", score: 76, date: "Yesterday", delta: 3 },
  { name: "Black Seed Hair Oil", store: "ArganBloom", score: 71, date: "2 days ago", delta: -2 },
  { name: "Hibiscus Face Mist", store: "ArganBloom", score: 88, date: "5 days ago", delta: 12 },
  { name: "Saffron Brightening Cream", store: "ArganBloom", score: 69, date: "1 week ago", delta: 0 },
];

export function Dashboard() {
  const { user, plan, auditsUsed } = useAppStore();
  const { startAuditAndNavigate, navigateToView } = useNavigateAfterAction();

  return (
    <div className="min-h-[calc(100vh-4rem)] mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            Welcome back, {user?.name.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Here's how your store is performing.</p>
        </div>
        <div className="flex items-center gap-2">
          {plan === "free" && (
            <Button variant="outline" className="rounded-full" onClick={() => navigateToView("pricing")}>
              <Crown className="size-4 mr-1 text-brand" /> Upgrade
            </Button>
          )}
          <Button onClick={startAuditAndNavigate} className="rounded-full shadow-glow">
            <Plus className="size-4 mr-1" /> New audit
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={TrendingUp}
          label="Average Store Score"
          value="77"
          delta="+13 this quarter"
          color="#FF6600"
        />
        <StatCard
          icon={Zap}
          label="Audits this month"
          value={String(auditsUsed || 12)}
          delta={plan === "free" ? "3 / 3 free limit" : "Unlimited"}
          color="#ff983f"
        />
        <StatCard
          icon={Bot}
          label="GEO visibility"
          value="71"
          delta="Above market avg"
          color="#ff983f"
        />
        <StatCard
          icon={ShieldCheck}
          label="Issues fixed"
          value="23"
          delta="of 41 found"
          color="#cc5200"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score trend */}
        <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-lg font-bold">Score trend</h2>
            <Badge variant="outline" className="rounded-full text-primary border-primary/30 bg-primary/5">
              <TrendingUp className="size-3 mr-1" /> +18 pts since May
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Your Store Score over the last 6 months.</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6600" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#FF6600" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" tick={{ fill: "oklch(0.55 0.02 170)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} tick={{ fill: "oklch(0.55 0.02 170)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="score" stroke="#FF6600" strokeWidth={2.5} fill="url(#trend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-lg font-bold">Your plan</h2>
            <Badge className={cn("rounded-full capitalize", plan === "free" ? "bg-muted text-foreground" : "gradient-brand text-white")}>
              {plan}
            </Badge>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <ScoreRadial score={plan === "free" ? 33 : plan === "pro" ? 66 : 100} size={80} stroke={7} label="Usage" animate={false} />
            <div className="text-sm">
              <div className="font-semibold">{plan === "free" ? "3 audits / month" : "Unlimited audits"}</div>
              <div className="text-muted-foreground">{plan === "free" ? `${3 - (auditsUsed % 3)} remaining` : "No limits"}</div>
            </div>
          </div>
          {plan === "free" && (
            <div className="mt-5 rounded-xl bg-gradient-to-br from-primary/10 to-gold/5 border border-primary/20 p-4">
              <Crown className="size-5 text-brand mb-1.5" />
              <div className="font-semibold text-sm">Unlock Pro</div>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Unlimited audits, competitor comparison &amp; AI Generator.</p>
              <Button size="sm" className="w-full rounded-full shadow-glow" onClick={() => navigateToView("pricing")}>
                Upgrade — $29/mo
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Recent audits */}
      <div className="mt-6 rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <h2 className="font-display text-lg font-bold">Recent audits</h2>
          <Button variant="ghost" size="sm" className="rounded-full text-xs">View all</Button>
        </div>
        <div className="divide-y divide-border/50">
          {RECENT.map((r, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigateToView("results")}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-accent/40 transition-colors text-left"
            >
              <ScoreRadial score={r.score} size={44} stroke={4.5} animate={false} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3" /> {r.date} · {r.store}
                </div>
              </div>
              <div className={cn(
                "hidden sm:flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                r.delta > 0 && "text-primary bg-primary/10",
                r.delta < 0 && "text-rose-500 bg-rose-500/10",
                r.delta === 0 && "text-muted-foreground bg-muted"
              )}>
                {r.delta > 0 && <ArrowUpRight className="size-3" />}
                {r.delta < 0 && <AlertCircle className="size-3" />}
                {r.delta > 0 ? `+${r.delta}` : r.delta}
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Integrations status */}
      <div className="mt-6">
        <IntegrationsStatus />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delta, color }: { icon: typeof Zap; label: string; value: string; delta: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="size-9 rounded-lg grid place-items-center" style={{ background: `${color}1a`, color }}>
          <Icon className="size-5" />
        </span>
      </div>
      <div className="mt-4 font-display text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      <div className="text-[11px] font-medium mt-2" style={{ color }}>{delta}</div>
    </div>
  );
}
