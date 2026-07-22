"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SiteQuiz } from "@/components/onboarding/site-quiz";
import { ConnectWebsiteStep } from "@/components/onboarding/connect-website";
import { FirstAuditStep } from "@/components/onboarding/first-audit";
import {
  getFlowStep,
  isGuidedFlowComplete,
} from "@/lib/workflow/flow-state";
import { isQuizComplete } from "@/lib/onboarding/validate";

const VALID_STEPS = new Set(["quiz", "connect", "audit"]);

export default function OnboardingStepPage() {
  const params = useParams();
  const router = useRouter();
  const step = String(params.step ?? "quiz");
  const [loading, setLoading] = React.useState(true);
  const [onboarding, setOnboarding] = React.useState<Record<string, string> | null>(null);

  React.useEffect(() => {
    if (!VALID_STEPS.has(step)) {
      router.replace("/onboarding/quiz");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding");
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        const ob = (data.onboarding as Record<string, string> | null) ?? null;
        setOnboarding(ob);

        if (isGuidedFlowComplete(ob)) {
          router.replace("/dashboard");
          return;
        }

        const flowStep = getFlowStep(ob);
        const quizDone = isQuizComplete(ob);

        // Soft-correct step mismatches
        if (step === "quiz" && quizDone) {
          router.replace(flowStep === "audit" ? "/onboarding/audit" : "/onboarding/connect");
          return;
        }
        if (step === "connect" && !quizDone) {
          router.replace("/onboarding/quiz");
          return;
        }
        if (step === "audit" && !quizDone) {
          router.replace("/onboarding/quiz");
          return;
        }
        if (step === "audit" && quizDone && !ob?.connectedWebsite) {
          router.replace("/onboarding/connect");
          return;
        }
      } catch {
        /* allow render */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === "connect") {
    const resume = Boolean(onboarding?.connectedWebsite) || getFlowStep(onboarding) === "connect";
    return (
      <ConnectWebsiteStep
        initialUrl={onboarding?.connectedWebsite}
        resume={resume && Boolean(onboarding?.connectedWebsite)}
      />
    );
  }

  if (step === "audit") {
    return (
      <FirstAuditStep
        websiteUrl={onboarding?.connectedWebsite ?? ""}
        resume={getFlowStep(onboarding) === "audit"}
      />
    );
  }

  return <SiteQuiz initialAnswers={onboarding ?? undefined} />;
}
