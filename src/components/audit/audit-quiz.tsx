"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Link2, Store, Swords, Check, Loader2,
  Search, Zap, Bot, ShieldCheck, Cpu, FileSearch, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { SAMPLE_AUDIT } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = ["Product", "Store", "Analyze"];

const ANALYSIS_PHASES = [
  { icon: FileSearch, label: "Reading page with Firecrawl", detail: "Title · description · images · price · CTAs" },
  { icon: Zap, label: "Scoring conversion", detail: "Persuasion, CTA visibility, benefit framing" },
  { icon: Search, label: "Scoring SEO", detail: "Meta, schema, keywords, structure" },
  { icon: Bot, label: "Scoring GEO / AI visibility", detail: "Testing ChatGPT, Perplexity, Google AI" },
  { icon: ShieldCheck, label: "Scoring trust", detail: "Policies, shipping, reviews, security" },
  { icon: Cpu, label: "Generating AI recommendations", detail: "Prioritized fixes + copy" },
];

function isValidUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function AuditQuiz() {
  const { setAudit, isAuthed, incrementAudits, onboarding } = useAppStore();
  const { navigateToView, openLoginAndNavigate } = useNavigateAfterAction();
  const [step, setStep] = React.useState(0);
  const [productUrl, setProductUrl] = React.useState("");
  const [storeUrl, setStoreUrl] = React.useState("");
  const [competitorUrl, setCompetitorUrl] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [phase, setPhase] = React.useState(0);
  const [touched, setTouched] = React.useState(false);

  const productValid = isValidUrl(productUrl);

  const runAnalysis = React.useCallback(() => {
    setAnalyzing(true);
    setPhase(0);
    const interval = setInterval(() => {
      setPhase((p) => {
        if (p >= ANALYSIS_PHASES.length - 1) {
          clearInterval(interval);
          // finish
          setTimeout(() => {
            const audit = {
              ...SAMPLE_AUDIT,
              productUrl: productUrl || SAMPLE_AUDIT.productUrl,
              storeUrl: storeUrl || undefined,
              competitorUrl: competitorUrl || undefined,
              productName: extractName(productUrl) || SAMPLE_AUDIT.productName,
              storeName: extractStore(productUrl) || SAMPLE_AUDIT.storeName,
              createdAt: new Date().toISOString(),
            };
            setAudit(audit);
            incrementAudits();
            navigateToView("results");
          }, 800);
          return p;
        }
        return p + 1;
      });
    }, 850);
  }, [productUrl, storeUrl, competitorUrl, setAudit, navigateToView, incrementAudits]);

  const next = () => {
    if (step === 0 && !productValid) {
      setTouched(true);
      toast.error("Please enter a valid product URL");
      return;
    }
    if (step === 1) {
      // gate
      if (!isAuthed) {
        toast.info("Sign in to save your audit", {
          description: "You can continue with a free account — no credit card.",
          action: { label: "Sign in with Google", onClick: () => openLoginAndNavigate() },
        });
      }
      runAnalysis();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  if (analyzing) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl">
          <div className="text-center mb-10">
            <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow mb-5 relative">
              <Cpu className="size-8" />
              <span className="absolute inset-0 rounded-2xl border-2 border-primary/40 animate-pulse-ring" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Auditing your page</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              {extractName(productUrl) || "Your product"} · this takes about 60 seconds
            </p>
          </div>

          <div className="space-y-2.5">
            {ANALYSIS_PHASES.map((p, i) => {
              const done = i < phase;
              const active = i === phase;
              return (
                <motion.div
                  key={i}
                  initial={false}
                  animate={{
                    opacity: i <= phase ? 1 : 0.4,
                    scale: active ? 1.01 : 1,
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3.5 transition-colors",
                    done && "border-primary/30 bg-primary/5",
                    active && "border-primary/50 bg-primary/10 shadow-glow",
                    !done && !active && "border-border/50 bg-card"
                  )}
                >
                  <span className={cn(
                    "size-9 rounded-lg grid place-items-center shrink-0",
                    done && "bg-primary/15 text-primary",
                    active && "gradient-brand text-white",
                    !done && !active && "bg-muted text-muted-foreground"
                  )}>
                    {done ? <Check className="size-4" /> : active ? <Loader2 className="size-4 animate-spin" /> : <p.icon className="size-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{p.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.detail}</div>
                  </div>
                  {active && (
                    <div className="flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <motion.span
                          key={d}
                          className="size-1.5 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn(
                "flex items-center gap-2 text-xs font-semibold transition-colors",
                i <= step ? "text-primary" : "text-muted-foreground"
              )}>
                <span className={cn(
                  "size-7 rounded-full grid place-items-center text-[11px] border transition-colors",
                  i < step && "bg-primary text-primary-foreground border-primary",
                  i === step && "border-primary text-primary bg-primary/10",
                  i > step && "border-border"
                )}>
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </span>
                {s}
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
                  <Link2 className="size-6" />
                </div>
                <h2 className="font-display text-2xl font-bold">Paste your product URL</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  The page you want to audit. This is the only required field.
                </p>
                {onboarding && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {onboarding.platform && (
                      <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
                        {onboarding.platform} store
                      </span>
                    )}
                    {onboarding.challenge && onboarding.challenge !== "dont_know" && (
                      <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 capitalize">
                        Focus: {onboarding.challenge.replace(/_/g, " ")}
                      </span>
                    )}
                    {onboarding.audience && (
                      <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border/60 uppercase">
                        {onboarding.audience}
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-6 space-y-2">
                  <Label htmlFor="product">Product URL <span className="text-rose-500">*</span></Label>
                  <Input
                    id="product"
                    type="url"
                    inputMode="url"
                    placeholder="https://shop.example.com/products/argan-glow-serum"
                    value={productUrl}
                    onChange={(e) => { setProductUrl(e.target.value); setTouched(false); }}
                    className={cn("h-12", touched && !productValid && "border-rose-500 focus-visible:ring-rose-500")}
                    autoFocus
                  />
                  {touched && !productValid && (
                    <p className="text-xs text-rose-500">Enter a valid URL starting with http:// or https://</p>
                  )}
                </div>
                <div className="mt-5 rounded-lg bg-muted/50 p-3.5 flex gap-2.5">
                  <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Works with any public product page — Shopify, WooCommerce, Salla, Zid, custom stores &amp; affiliate pages.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center mb-4">
                  <Swords className="size-6" />
                </div>
                <h2 className="font-display text-2xl font-bold">Optional: store &amp; competitor</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your store homepage to audit trust signals, and a competitor to benchmark against.
                </p>
                <div className="mt-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="store" className="flex items-center gap-1.5">
                      <Store className="size-3.5" /> Store URL <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="store"
                      type="url"
                      placeholder="https://shop.example.com"
                      value={storeUrl}
                      onChange={(e) => setStoreUrl(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comp" className="flex items-center gap-1.5">
                      <Swords className="size-3.5" /> Competitor product URL <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="comp"
                      type="url"
                      placeholder="https://competitor.com/products/similar-item"
                      value={competitorUrl}
                      onChange={(e) => setCompetitorUrl(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
                <div className="mt-5 rounded-lg bg-primary/5 border border-primary/20 p-3.5 flex gap-2.5">
                  <Bot className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Pro tip: benchmarking against your top competitor unlocks the gap analysis — see exactly where you win and lose.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={back} disabled={step === 0} className="rounded-full">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Button>
            <div className="flex items-center gap-2">
              {step === 0 && (
                <Button variant="ghost" onClick={() => navigateToView("landing")} className="rounded-full text-muted-foreground">
                  Cancel
                </Button>
              )}
              <Button onClick={next} className="rounded-full font-semibold px-6 shadow-glow">
                {step === STEPS.length - 1 ? (
                  <>Run audit <ArrowRight className="size-4 ml-1" /></>
                ) : step === 1 ? (
                  <>Run audit <ArrowRight className="size-4 ml-1" /></>
                ) : (
                  <>Continue <ArrowRight className="size-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function extractName(url: string) {
  if (!url) return "";
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean).pop() || "";
    return seg.replace(/-/g, " ").replace(/\.\w+$/, "").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
  } catch {
    return "";
  }
}
function extractStore(url: string) {
  if (!url) return "";
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    return host.split(".")[0].replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "";
  }
}
