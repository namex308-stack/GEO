import { OnboardingFlow } from "@/components/app/onboarding-flow";

/** Canonical step 2 route (also matched by /onboarding/[step]). */
export default function OnboardingPlatformPage() {
  return <OnboardingFlow stepSlug="platform" />;
}
