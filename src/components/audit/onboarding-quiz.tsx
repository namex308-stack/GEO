"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ArrowRight, ArrowLeft, ShoppingBag, Code2, Boxes, Sparkles,
  TrendingDown, ShoppingCart, Search, HelpCircle, Banknote, Users, Building2,
  Scale, Instagram, Music2, Megaphone, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, type OnboardingAnswers } from "@/lib/store";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
  desc?: string;
  icon: typeof ShoppingBag;
}

interface Question {
  key: keyof OnboardingAnswers;
  title: string;
  subtitle: string;
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    key: "platform",
    title: "What platform do you use for your store?",
    subtitle: "We tailor recommendations to your stack.",
    options: [
      { value: "shopify", label: "Shopify", desc: "Shopify Plus or standard", icon: ShoppingBag },
      { value: "woocommerce", label: "WooCommerce", desc: "WordPress + WooCommerce", icon: Boxes },
      { value: "custom", label: "Custom Store", desc: "Self-built or headless", icon: Code2 },
      { value: "other", label: "Other", desc: "Salla, Zid, Magento, Wix…", icon: Sparkles },
    ],
  },
  {
    key: "challenge",
    title: "What is your biggest challenge right now?",
    subtitle: "We'll prioritize the fixes that matter most to you.",
    options: [
      { value: "traffic_low_sales", label: "High traffic but low sales", desc: "Visitors aren't converting", icon: TrendingDown },
      { value: "abandoned_carts", label: "Abandoned carts", desc: "Checkout drop-off", icon: ShoppingCart },
      { value: "poor_ranking", label: "Poor Google ranking", desc: "Not showing up in search", icon: Search },
      { value: "dont_know", label: "I don't know — find out for me", desc: "Let the audit decide", icon: HelpCircle },
    ],
  },
  {
    key: "priceRange",
    title: "What is the price range for your products?",
    subtitle: "Helps us benchmark conversion expectations.",
    options: [
      { value: "under_100", label: "Less than 100", desc: "SAR / EGP · impulse buys", icon: Banknote },
      { value: "100_500", label: "100 – 500", desc: "SAR / EGP · considered", icon: Banknote },
      { value: "over_500", label: "More than 500", desc: "SAR / EGP · high-ticket", icon: Banknote },
    ],
  },
  {
    key: "audience",
    title: "Who is your target audience?",
    subtitle: "We adjust tone and persuasion scoring accordingly.",
    options: [
      { value: "b2c", label: "Individuals (B2C)", desc: "Selling to consumers", icon: Users },
      { value: "b2b", label: "Businesses (B2B)", desc: "Selling to companies", icon: Building2 },
      { value: "both", label: "Both", desc: "B2C and B2B", icon: Scale },
    ],
  },
  {
    key: "referral",
    title: "How did you hear about us?",
    subtitle: "Just so we know who sent you.",
    options: [
      { value: "google", label: "Google", icon: Search },
      { value: "instagram", label: "Instagram", icon: Instagram },
      { value: "tiktok", label: "TikTok", icon: Music2 },
      { value: "recommendation", label: "Recommendation", desc: "A friend or partner", icon: Megaphone },
      { value: "other", label: "Other", icon: HelpCircle },
    ],
  },
];

export function OnboardingQuiz() {
  const { setOnboarding, user } = useAppStore();
  const { navigateToView } = useNavigateAfterAction();
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Partial<OnboardingAnswers>>({});
  const [building, setBuilding] = React.useState(false);

  const total = QUESTIONS.length;
  const q = QUESTIONS[step];
  const selected = answers[q.key];

  const pick = (value: string) => {
    setAnswers((a) => ({ ...a, [q.key]: value }));
  };

  const next = () => {
    if (!selected) return;
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      // finish
      setBuilding(true);
      setTimeout(() => {
        setOnboarding(answers as OnboardingAnswers);
        navigateToView("audit");
      }, 2200);
    }
  };

  const back = () => {
    if (step === 0) {
      navigateToView("landing");
    } else {
      setStep((s) => s - 1);
    }
  };

  if (building) {
    return <BuildingProfile answers={answers as OnboardingAnswers} />;
  }

  const progress = ((step + 1) / total) * 100;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* ambient bg */}
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 blur-[140px] rounded-full -z-10" />

      <div className="w-full max-w-2xl">
        {/* greeting */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium"
          >
            <span className="size-6 rounded-full gradient-brand grid place-items-center text-white text-[10px] font-bold">
              {user?.avatar ?? "U"}
            </span>
            Welcome{user ? `, ${user.name.split(" ")[0]}` : ""} — let's tailor your audit
          </motion.div>
        </div>

        {/* progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
            <span>Question {step + 1} of {total}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full gradient-brand"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-balance text-center">
              {q.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-center text-pretty">
              {q.subtitle}
            </p>

            <div className={cn(
              "mt-8 grid gap-3",
              q.options.length > 4 ? "sm:grid-cols-2" : "sm:grid-cols-2"
            )}>
              {q.options.map((opt, i) => {
                const active = selected === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => pick(opt.value)}
                    whileHover={{ y: -2 }}
                    className={cn(
                      "group relative flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200",
                      active
                        ? "border-primary bg-primary/5 shadow-glow"
                        : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/40"
                    )}
                  >
                    <span className={cn(
                      "size-11 rounded-xl grid place-items-center shrink-0 transition-colors",
                      active ? "gradient-brand text-white" : "bg-muted text-muted-foreground group-hover:text-foreground"
                    )}>
                      <opt.icon className="size-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{opt.label}</div>
                      {opt.desc && (
                        <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                      )}
                    </div>
                    <span className={cn(
                      "size-5 rounded-full border-2 grid place-items-center shrink-0 transition-all",
                      active ? "border-primary bg-primary" : "border-border opacity-0 group-hover:opacity-100"
                    )}>
                      {active && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* controls */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={back} className="rounded-full">
            <ArrowLeft className="size-4 mr-1" /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          <Button
            onClick={next}
            disabled={!selected}
            className="rounded-full font-semibold px-7 shadow-glow disabled:opacity-40 disabled:shadow-none"
          >
            {step === total - 1 ? (
              <>Build my audit <ArrowRight className="size-4 ml-1" /></>
            ) : (
              <>Continue <ArrowRight className="size-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BuildingProfile({ answers }: { answers: OnboardingAnswers }) {
  const steps = [
    "Saving your profile",
    `Configuring for ${answers.platform} stores`,
    answers.challenge === "dont_know" ? "Running full diagnostic" : `Prioritizing ${answers.challenge.replace(/_/g, " ")}`,
    "Preparing your audit workspace",
  ];
  const [done, setDone] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => {
      setDone((d) => Math.min(d + 1, steps.length));
    }, 480);
    return () => clearInterval(t);
  }, [steps.length]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto size-20 rounded-3xl gradient-brand grid place-items-center text-white shadow-glow mb-6 relative"
        >
          <Loader2 className="size-9 animate-spin" />
        </motion.div>
        <h2 className="font-display text-2xl font-bold">Building your audit profile</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Personalizing StorePulse to your store, challenge and audience.
        </p>
        <div className="mt-8 space-y-2.5 text-left">
          {steps.map((s, i) => {
            const isDone = i < done;
            const isActive = i === done;
            return (
              <motion.div
                key={i}
                animate={{ opacity: i <= done ? 1 : 0.4 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                  isDone && "border-primary/30 bg-primary/5",
                  isActive && "border-primary/50 bg-primary/10",
                  !isDone && !isActive && "border-border/50 bg-card"
                )}
              >
                <span className={cn(
                  "size-7 rounded-lg grid place-items-center shrink-0",
                  isDone && "bg-primary/15 text-primary",
                  isActive && "gradient-brand text-white",
                  !isDone && !isActive && "bg-muted text-muted-foreground"
                )}>
                  {isDone ? <Check className="size-4" /> : isActive ? <Loader2 className="size-4 animate-spin" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                </span>
                <span className="text-sm font-medium">{s}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
