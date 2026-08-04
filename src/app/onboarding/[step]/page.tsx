import { notFound, redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/app/onboarding-flow";
import { isOnboardingStepSlug } from "@/lib/onboarding/constants";

/** Legacy quiz / multi-field URLs → one-question-per-step slugs. */
const LEGACY: Record<string, string> = {
  store: "business-name",
  business: "business-name",
  goals: "challenge",
};

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: raw } = await params;

  if (raw === "done") {
    redirect("/onboarding/done");
  }

  const mapped = LEGACY[raw];
  if (mapped) {
    redirect(`/onboarding/${mapped}`);
  }

  if (!isOnboardingStepSlug(raw)) {
    notFound();
  }

  return <OnboardingFlow stepSlug={raw} />;
}
