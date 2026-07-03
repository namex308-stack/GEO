"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import {
  Zap, Search, Bot, ShieldCheck, ArrowRight, X, Check, AlertTriangle, Lightbulb,
  Download, Share2, TrendingUp, RotateCcw, Sparkles, Copy, Crown,
  Target, Clock, Gauge, FileText, ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRadial, ScoreBar } from "@/components/common/score-viz";
import { Reveal } from "@/components/common/visual-effects";
import { useAppStore } from "@/lib/store";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { AI_GENERATED } from "@/lib/mock-data";
import type { Recommendation, ScorePillar } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PILLAR_META: Record<ScorePillar, { icon: typeof Zap; color: string; label: string; desc: string }> = {
  conversion: { icon: Zap, color: "#FF6600", label: "Conversion", desc: "How hard your page sells" },
  seo: { icon: Search, color: "#ff983f", label: "SEO", desc: "Can Google find & rank you" },
  geo: { icon: Bot, color: "#cc5200", label: "GEO / AI Visibility", desc: "Can AI recommend you" },
  trust: { icon: ShieldCheck, color: "#929292", label: "Trust", desc: "Does the shopper believe you" },
};

const SEVERITY_META = {
  critical: { icon: Zap, color: "#f43f5e", label: "Critical", bg: "bg-rose-500/10", rank: 0 },
  warning: { icon: AlertTriangle, color: "#ff983f", label: "Warning", bg: "bg-brand/10", rank: 1 },
  opportunity: { icon: Lightbulb, color: "#FF6600", label: "Opportunity", bg: "bg-primary/10", rank: 2 },
};

const EFFORT_META = {
  quick: { label: "Quick fix", desc: "< 30 min", color: "text-emerald-600" },
  medium: { label: "Medium", desc: "1–3 hours", color: "text-brand" },
  involved: { label: "Involved", desc: "1+ day", color: "text-rose-500" },
};

export function AuditResults() {
  const { audit, isAuthed, plan } = useAppStore();
  const { navigateToView, openLoginAndNavigate } = useNavigateAfterAction();
  const [activePillar, setActivePillar] = React.useState<ScorePillar | "all">("all");
  const [sortBy, setSortBy] = React.useState<"priority" | "impact" | "effort">("priority");

  const allRecs = audit?.recommendations ?? [];
  const filtered = activePillar === "all" ? allRecs : allRecs.filter((r) => r.pillar === activePillar);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    const severityRank = (r: Recommendation) => SEVERITY_META[r.severity].rank;
    const impactRank = (r: Recommendation) => ({ high: 0, medium: 1, low: 2 }[r.impact]);
    const effortRank = (r: Recommendation) => ({ quick: 0, medium: 1, involved: 2 }[r.effort ?? "medium"]);
    if (sortBy === "priority") arr.sort((a, b) => severityRank(a) - severityRank(b) || impactRank(a) - impactRank(b));
    if (sortBy === "impact") arr.sort((a, b) => impactRank(a) - impactRank(b));
    if (sortBy === "effort") arr.sort((a, b) => effortRank(a) - effortRank(b));
    return arr;
  }, [filtered, sortBy]);

  if (!audit) {
    return (
      <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No audit found.</p>
          <Button onClick={() => navigateToView("audit")} className="rounded-full">Run an audit</Button>
        </div>
      </div>
    );
  }

  const hasCompetitor = !!audit.competitorUrl && !!audit.competitorBreakdown;
  const isFree = plan === "free";

  const visibleRecs = isFree ? sorted.slice(0, 5) : sorted;
  const lockedRecs = isFree ? sorted.slice(5) : [];

  const comparisonData = audit.breakdown.map((b) => ({
    pillar: b.label.split(" ")[0],
    you: b.score,
    competitor: audit.competitorBreakdown?.find((c) => c.pillar === b.pillar)?.score ?? 0,
  }));

  const criticalCount = allRecs.filter((r) => r.severity === "critical").length;
  const totalLift = allRecs.reduce((sum, r) => {
    const m = r.estimatedLift?.match(/\+(\d+)/);
    return sum + (m ? parseInt(m[1]) : 0);
  }, 0);

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Sticky score header */}
      <div className="sticky top-16 z-30 glass border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <ScoreRadial score={audit.overallScore} size={48} stroke={5} animate={false} />
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{audit.productName}</div>
              <div className="text-xs text-muted-foreground truncate">{audit.storeName} · Store Score {audit.overallScore}/100</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-full hidden sm:inline-flex" onClick={() => toast.info("Exporting PDF report…")}>
              <Download className="size-4 mr-1" /> Export
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full hidden sm:inline-flex" onClick={() => toast.success("Share link copied")}>
              <Share2 className="size-4 mr-1" /> Share
            </Button>
            <Button size="sm" className="rounded-full" onClick={() => navigateToView("audit")}>
              <RotateCcw className="size-4 mr-1" /> New audit
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* ===== Executive Summary ===== */}
        <Reveal>
          <section className="rounded-3xl border border-border/60 bg-card p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-3xl rounded-full -z-0" />
            <div className="relative grid lg:grid-cols-[auto_1fr] gap-8 items-center">
              <div className="flex flex-col items-center text-center">
                <ScoreRadial score={audit.overallScore} size={180} stroke={12} label="Store Score" />
                {hasCompetitor && (
                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <TrendingUp className="size-4" />
                    +{audit.overallScore - (audit.competitorScore ?? 0)} vs competitor
                  </div>
                )}
              </div>
              <div>
                <Badge variant="outline" className="rounded-full mb-3 gap-1.5 border-primary/30 bg-primary/5 text-primary">
                  <Sparkles className="size-3" /> Audit complete · {new Date(audit.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </Badge>
                <h1 className="font-display text-2xl sm:text-3xl font-bold">{audit.productName}</h1>
                <p className="mt-1 text-sm text-muted-foreground break-all">{audit.productUrl}</p>

                <div className="mt-5 grid sm:grid-cols-3 gap-3">
                  <SummaryStat icon={Zap} label="Critical issues" value={String(criticalCount)} tone="rose" />
                  <SummaryStat icon={TrendingUp} label="Projected lift" value={`+${totalLift} pts`} tone="primary" />
                  <SummaryStat icon={ListChecks} label="Recommendations" value={String(allRecs.length)} tone="brand" />
                </div>

                <div className="mt-5 rounded-xl border border-border/50 bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText className="size-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Executive summary</span>
                  </div>
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    Your page scores <strong>{audit.overallScore}/100</strong> — above average for your category.
                    You lead on <strong>SEO</strong> and <strong>Trust</strong>, but your <strong>conversion</strong> score is held back by
                    a feature-led description and a low-contrast CTA. {hasCompetitor && "You're ahead of your competitor by 8 points overall, but they edge you on conversion. "}
                    Fixing the <strong>{criticalCount} critical issues</strong> below could lift your Store Score to an estimated <strong className="text-primary">{Math.min(audit.overallScore + totalLift, 100)}</strong>.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ===== Score Breakdown ===== */}
        <Reveal>
          <section>
            <SectionHeader icon={Gauge} title="Score breakdown" subtitle="The four pillars that decide your Store Score." />
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {audit.breakdown.map((b, i) => {
                const meta = PILLAR_META[b.pillar];
                return (
                  <motion.div
                    key={b.pillar}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-border/60 bg-card p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="size-10 rounded-xl grid place-items-center" style={{ background: `${meta.color}1a`, color: meta.color }}>
                        <meta.icon className="size-5" />
                      </span>
                      <span className="font-display text-2xl font-extrabold tabular-nums" style={{ color: meta.color }}>{b.score}</span>
                    </div>
                    <div className="font-semibold text-sm">{b.label}</div>
                    <div className="text-[11px] text-muted-foreground mb-3">{meta.desc}</div>
                    <ScoreBar score={b.score} label="" delay={0.2 + i * 0.05} />
                    <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{b.summary}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </Reveal>

        {/* ===== Competitor + GEO ===== */}
        <section className="grid lg:grid-cols-2 gap-6">
          {hasCompetitor && (
            <Reveal>
              <div className="rounded-2xl border border-border/60 bg-card p-6 h-full">
                <SectionHeader icon={TrendingUp} title="Competitor comparison" subtitle={audit.competitorUrl ?? ""} compact />
                <div className="mt-5 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis type="category" dataKey="pillar" tick={{ fill: "oklch(0.45 0.01 250)", fontSize: 12, fontWeight: 600 }} width={70} />
                      <Tooltip cursor={{ fill: "oklch(0.5 0.01 250 / 0.05)" }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                      <Bar dataKey="competitor" radius={[0, 6, 6, 0]} fill="oklch(0.63 0 0 / 0.35)" barSize={14} />
                      <Bar dataKey="you" radius={[0, 6, 6, 0]} fill="#FF6600" barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-5 text-xs mt-2">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> You</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-muted-foreground/40" /> Competitor</span>
                </div>
              </div>
            </Reveal>
          )}

          <Reveal delay={0.1}>
            <div className={cn("rounded-2xl border p-6 h-full", hasCompetitor ? "border-border/60 bg-card" : "border-brand/30 bg-gradient-to-br from-brand/5 to-transparent lg:col-span-2")}>
              <SectionHeader icon={Bot} title="GEO / AI Visibility" subtitle="Can generative engines read and recommend your product?" compact />
              <div className="mt-5 grid grid-cols-3 gap-4">
                {[
                  { name: "ChatGPT", score: audit.geoReadability.chatgpt },
                  { name: "Perplexity", score: audit.geoReadability.perplexity },
                  { name: "Google AI", score: audit.geoReadability.googleAI },
                ].map((g, i) => (
                  <motion.div
                    key={g.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="text-center rounded-xl border border-border/50 bg-background/40 p-4"
                  >
                    <ScoreRadial score={g.score} size={88} stroke={7} gold />
                    <div className="text-xs font-semibold mt-2">{g.name}</div>
                  </motion.div>
                ))}
              </div>
              <p className="mt-5 text-xs text-muted-foreground leading-relaxed">
                Your page is partially readable by AI assistants but lacks a clear positioning statement and structured Q&A —
                the two signals generative engines reuse when recommending products.
              </p>
            </div>
          </Reveal>
        </section>

        {/* ===== Recommendations ===== */}
        <Reveal>
          <section>
            <SectionHeader
              icon={ListChecks}
              title="AI recommendations"
              subtitle="Prioritized by impact. Each includes the problem, the fix, and the projected lift."
            />

            {/* Filters + sort */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                <FilterBtn active={activePillar === "all"} onClick={() => setActivePillar("all")}>All ({allRecs.length})</FilterBtn>
                {(Object.keys(PILLAR_META) as ScorePillar[]).map((p) => {
                  const count = allRecs.filter((r) => r.pillar === p).length;
                  return (
                    <FilterBtn key={p} active={activePillar === p} onClick={() => setActivePillar(p)}>
                      {PILLAR_META[p].label.split(" ")[0]} ({count})
                    </FilterBtn>
                  );
                })}
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Sort:</span>
                {(["priority", "impact", "effort"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={cn(
                      "px-2.5 py-1 rounded-full font-medium capitalize transition-colors",
                      sortBy === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-4">
              {visibleRecs.map((r, i) => (
                <RecCard key={r.id} rec={r} index={i} onCopy={() => copy(r.solution, "Solution")} />
              ))}
            </div>

            {lockedRecs.length > 0 && (
              <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center">
                <Crown className="size-8 text-brand mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold">{lockedRecs.length} more recommendations on Pro</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Unlock all {allRecs.length} recommendations, competitor deep-dives and the AI Generator.
                </p>
                <Button className="mt-4 rounded-full shadow-glow" onClick={() => { if (!isAuthed) openLoginAndNavigate(); else navigateToView("pricing"); }}>
                  <Crown className="size-4 mr-1" /> Upgrade to Pro — $29/mo
                </Button>
              </div>
            )}
          </section>
        </Reveal>

        {/* ===== AI Generator ===== */}
        <Reveal>
          <section>
            <SectionHeader
              icon={Sparkles}
              title="AI Generator"
              subtitle="Ready-to-paste copy, generated from your audit. One click to copy."
              badge={isFree ? "Pro" : undefined}
            />
            <Tabs defaultValue="title" className="w-full mt-5">
              <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="title" className="rounded-lg">Title</TabsTrigger>
                <TabsTrigger value="description" className="rounded-lg">Description</TabsTrigger>
                <TabsTrigger value="faq" className="rounded-lg">FAQ</TabsTrigger>
                <TabsTrigger value="meta" className="rounded-lg">Meta</TabsTrigger>
                <TabsTrigger value="ad" className="rounded-lg">Ad copy</TabsTrigger>
              </TabsList>

              <TabsContent value="title" className="mt-4">
                <GenCard label="Optimized product title" onCopy={() => copy(AI_GENERATED.title, "Title")}>
                  <p className="text-base font-display font-semibold leading-relaxed">{AI_GENERATED.title}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full text-xs">SEO-optimized</Badge>
                    <Badge variant="outline" className="rounded-full text-xs">GEO-friendly</Badge>
                    <Badge variant="outline" className="rounded-full text-xs">{AI_GENERATED.title.length} chars</Badge>
                  </div>
                </GenCard>
              </TabsContent>

              <TabsContent value="description" className="mt-4">
                <GenCard label="Benefit-led description" onCopy={() => copy(AI_GENERATED.description, "Description")}>
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">{AI_GENERATED.description}</pre>
                </GenCard>
              </TabsContent>

              <TabsContent value="faq" className="mt-4 space-y-3">
                {AI_GENERATED.faq.map((f, i) => (
                  <GenCard key={i} label={f.q} onCopy={() => copy(`Q: ${f.q}\nA: ${f.a}`, "FAQ")}>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </GenCard>
                ))}
              </TabsContent>

              <TabsContent value="meta" className="mt-4">
                <GenCard label="Meta description" onCopy={() => copy(AI_GENERATED.metaDescription, "Meta description")}>
                  <p className="text-sm font-mono leading-relaxed text-foreground/90">{AI_GENERATED.metaDescription}</p>
                  <div className="mt-2 text-xs text-muted-foreground">{AI_GENERATED.metaDescription.length} chars · optimal for Google &amp; AI</div>
                </GenCard>
              </TabsContent>

              <TabsContent value="ad" className="mt-4 space-y-3">
                {AI_GENERATED.adCopy.map((ad, i) => (
                  <GenCard key={i} label={ad.platform} onCopy={() => copy(`${ad.headline}\n\n${ad.body}\n\nCTA: ${ad.cta}`, ad.platform)}>
                    <div className="text-base font-display font-bold">{ad.headline}</div>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{ad.body}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      CTA: {ad.cta}
                    </div>
                  </GenCard>
                ))}
              </TabsContent>
            </Tabs>
          </section>
        </Reveal>

        {/* ===== Action plan ===== */}
        <Reveal>
          <section className="rounded-2xl gradient-brand p-8 sm:p-10 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-dots opacity-20" />
            <div className="relative">
              <h3 className="font-display text-2xl font-bold">Apply the fixes &amp; re-audit in 2 weeks</h3>
              <p className="mt-2 text-white/85 max-w-lg mx-auto">
                Implement the recommendations, then schedule a re-audit to measure your improvement. Pro users get automated monitoring.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Button variant="secondary" className="rounded-full font-semibold" onClick={() => navigateToView("pricing")}>
                  <Crown className="size-4 mr-1" /> Upgrade for monitoring
                </Button>
                <Button variant="outline" className="rounded-full font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => navigateToView("dashboard")}>
                  View all audits <ArrowRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function SectionHeader({
  icon: Icon, title, subtitle, badge, compact,
}: {
  icon: typeof Zap; title: string; subtitle?: string; badge?: string; compact?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon className="size-5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className={cn("font-display font-bold", compact ? "text-lg" : "text-2xl")}>{title}</h2>
          {badge && <Badge className="gap-1 rounded-full gradient-brand text-white"><Crown className="size-3" /> {badge}</Badge>}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}

function SummaryStat({ icon: Icon, label, value, tone }: { icon: typeof Zap; label: string; value: string; tone: "rose" | "primary" | "brand" }) {
  const colors = {
    rose: "bg-rose-500/10 text-rose-500",
    primary: "bg-primary/10 text-primary",
    brand: "bg-brand/10 text-brand",
  };
  return (
    <div className="rounded-xl border border-border/50 bg-background/50 p-3.5 flex items-center gap-3">
      <span className={cn("size-9 rounded-lg grid place-items-center shrink-0", colors[tone])}>
        <Icon className="size-5" />
      </span>
      <div>
        <div className="font-display text-lg font-bold tabular-nums leading-none">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
        active ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/60"
      )}
    >
      {children}
    </button>
  );
}

function RecCard({ rec, index, onCopy }: { rec: Recommendation; index: number; onCopy: () => void }) {
  const meta = PILLAR_META[rec.pillar];
  const sev = SEVERITY_META[rec.severity];
  const effort = EFFORT_META[rec.effort ?? "medium"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className={cn("size-7 rounded-lg grid place-items-center", sev.bg)} style={{ color: sev.color }}>
            <sev.icon className="size-4" />
          </span>
          <span className="text-xs font-semibold">{meta.label}</span>
          {rec.category && <span className="text-[10px] text-muted-foreground hidden sm:inline">· {rec.category}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", sev.bg)} style={{ color: sev.color }}>
            {sev.label}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3 flex-1">
        <div className="flex gap-2.5">
          <span className="size-5 rounded-full bg-rose-500/15 grid place-items-center shrink-0 mt-0.5">
            <X className="size-3 text-rose-500" />
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-0.5">Problem</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{rec.problem}</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <span className="size-5 rounded-full bg-primary/15 grid place-items-center shrink-0 mt-0.5">
            <Check className="size-3 text-primary" />
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">Solution</div>
            <p className="text-sm text-foreground/90 leading-relaxed">{rec.solution}</p>
          </div>
        </div>
      </div>
      {/* Footer: impact, effort, lift */}
      <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="flex items-center gap-1 font-semibold">
          <Target className="size-3" /> {rec.impact} impact
        </span>
        <span className="text-muted-foreground">·</span>
        <span className={cn("flex items-center gap-1 font-semibold", effort.color)}>
          <Clock className="size-3" /> {effort.label}
        </span>
        {rec.estimatedLift && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1 font-bold text-primary">
              <TrendingUp className="size-3" /> {rec.estimatedLift}
            </span>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={onCopy} className="ml-auto h-7 px-2 text-[11px] rounded-full">
          <Copy className="size-3 mr-1" /> Copy fix
        </Button>
      </div>
    </motion.div>
  );
}

function GenCard({ label, onCopy, children }: { label: string; onCopy: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-muted-foreground">{label}</h4>
        <Button size="sm" variant="ghost" onClick={onCopy} className="rounded-full h-7 px-2.5 text-xs shrink-0">
          <Copy className="size-3 mr-1" /> Copy
        </Button>
      </div>
      {children}
    </div>
  );
}
