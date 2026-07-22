"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { useT } from "@/lib/i18n";
import { useSession } from "@/components/auth/session-provider";
import { SITE_QUIZ_QUESTIONS } from "@/lib/onboarding/quiz-questions";
import type { OnboardingAnswers } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function SiteQuiz({
  initialAnswers,
}: {
  initialAnswers?: Record<string, string>;
} = {}) {
  const t = useT();
  const router = useRouter();
  const { user } = useSession();

  const seedAnswers = React.useMemo(() => {
    if (!initialAnswers) return {} as Partial<OnboardingAnswers>;
    const partial: Partial<OnboardingAnswers> = {};
    for (const q of SITE_QUIZ_QUESTIONS) {
      const v = initialAnswers[q.key];
      if (typeof v === "string" && v.length > 0) {
        partial[q.key] = v;
      }
    }
    return partial;
  }, [initialAnswers]);

  const firstIncomplete = React.useMemo(() => {
    const idx = SITE_QUIZ_QUESTIONS.findIndex((q) => !seedAnswers[q.key]);
    return idx === -1 ? 0 : idx;
  }, [seedAnswers]);

  const hasProgress = Object.keys(seedAnswers).length > 0;
  const [step, setStep] = React.useState(firstIncomplete);
  const [answers, setAnswers] = React.useState<Partial<OnboardingAnswers>>(seedAnswers);
  const [building, setBuilding] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const total = SITE_QUIZ_QUESTIONS.length;
  const q = SITE_QUIZ_QUESTIONS[step];
  const selected = answers[q.key];

  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.user_metadata?.name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "";

  const persistPartial = async (next: Partial<OnboardingAnswers>) => {
    try {
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...next, flowStep: "quiz" }),
      });
    } catch {
      /* non-blocking */
    }
  };

  const pick = (value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [q.key]: value };
      void persistPartial(next);
      return next;
    });
  };

  const saveAndFinish = async (finalAnswers: OnboardingAnswers) => {
    setSaving(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalAnswers),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save profile");
      }
      router.push("/onboarding/connect");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setBuilding(false);
      setSaving(false);
    }
  };

  const next = () => {
    if (!selected) return;
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      setBuilding(true);
      const finalAnswers = answers as OnboardingAnswers;
      setTimeout(() => {
        void saveAndFinish(finalAnswers);
      }, 2400);
    }
  };

  const back = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (building) {
    return (
      <BuildingProfile
        answers={answers as OnboardingAnswers}
        saving={saving}
        t={t}
      />
    );
  }

  const progress = ((step + 1) / total) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 blur-[140px] rounded-full -z-10" />

      <div className="mb-6">
        <Logo className="h-8" />
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium"
          >
            <span className="size-6 rounded-full gradient-brand grid place-items-center text-white">
              <Sparkles className="size-3" />
            </span>
            {hasProgress
              ? t("nav.resume")
              : displayName
                ? t("onboarding.quiz.welcomeNamed", { name: displayName })
                : t("onboarding.quiz.welcome")}
          </motion.div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
            <span>{t("onboarding.quiz.progress", { current: step + 1, total })}</span>
            <span>{t("onboarding.quiz.percentComplete", { percent: Math.round(progress) })}</span>
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

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-balance text-center">
              {t(q.titleKey)}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-center text-pretty">
              {t(q.subtitleKey)}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {q.options.map((opt, i) => {
                const active = selected === opt.value;
                const Icon = opt.icon;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => pick(opt.value)}
                    whileHover={{ y: -2 }}
                    className={cn(
                      "group relative flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200",
                      active
                        ? "border-primary bg-primary/5 shadow-glow"
                        : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/40"
                    )}
                  >
                    <span
                      className={cn(
                        "size-11 rounded-xl grid place-items-center shrink-0 transition-colors",
                        active
                          ? "gradient-brand text-white"
                          : "bg-muted text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{t(opt.labelKey)}</div>
                      {opt.descKey && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t(opt.descKey)}
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "size-5 rounded-full border-2 grid place-items-center shrink-0 transition-all",
                        active
                          ? "border-primary bg-primary"
                          : "border-border opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {active && (
                        <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 0}
            className="rounded-full"
          >
            <ArrowLeft className="size-4 mr-1" /> {t("onboarding.back")}
          </Button>
          <Button
            onClick={next}
            disabled={!selected}
            className="rounded-full font-semibold px-7 shadow-glow disabled:opacity-40 disabled:shadow-none"
          >
            {step === total - 1 ? (
              <>
                {hasProgress ? t("nav.resume") : t("onboarding.buildProfile")}{" "}
                <ArrowRight className="size-4 ml-1" />
              </>
            ) : (
              <>
                {hasProgress && step === firstIncomplete
                  ? t("nav.resume")
                  : t("onboarding.continue")}{" "}
                <ArrowRight className="size-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BuildingProfile({
  answers,
  saving,
  t,
}: {
  answers: OnboardingAnswers;
  saving: boolean;
  t: ReturnType<typeof useT>;
}) {
  const steps = [
    t("onboarding.done.saveProfile"),
    t("onboarding.done.configurePlatform"),
    answers.challenge === "dont_know"
      ? t("onboarding.quiz.building.fullDiagnostic")
      : t("onboarding.done.prioritize"),
    t("onboarding.done.prepare"),
  ];
  const [done, setDone] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setDone((d) => Math.min(d + 1, steps.length));
    }, 520);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mx-auto size-20 rounded-3xl gradient-brand grid place-items-center text-white shadow-glow mb-6"
        >
          <Loader2 className="size-9 animate-spin" />
        </motion.div>
        <h2 className="font-display text-2xl font-bold">{t("onboarding.done.building")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("onboarding.done.buildingSub")}</p>
        <div className="mt-8 space-y-2.5 text-left">
          {steps.map((label, i) => {
            const isDone = i < done;
            const isActive = i === done;
            return (
              <motion.div
                key={label}
                animate={{ opacity: i <= done ? 1 : 0.4 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                  isDone && "border-primary/30 bg-primary/5",
                  isActive && "border-primary/50 bg-primary/10",
                  !isDone && !isActive && "border-border/50 bg-card"
                )}
              >
                <span
                  className={cn(
                    "size-7 rounded-lg grid place-items-center shrink-0",
                    isDone && "bg-primary/15 text-primary",
                    isActive && "gradient-brand text-white",
                    !isDone && !isActive && "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <Check className="size-4" />
                  ) : isActive ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  )}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </motion.div>
            );
          })}
        </div>
        {saving && (
          <p className="mt-6 text-xs text-muted-foreground">{t("onboarding.quiz.saving")}</p>
        )}
      </div>
    </div>
  );
}
