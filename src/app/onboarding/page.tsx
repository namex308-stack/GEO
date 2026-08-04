import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { onboardingPathForStep } from "@/lib/onboarding/constants";

/** Server entry: resume incomplete onboarding or send completed users to dashboard. */
export default async function OnboardingIndexPage() {
  const sb = await createSupabaseServerClient();
  if (!sb) {
    redirect("/auth?next=/onboarding&error=supabase_not_configured");
  }

  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    redirect("/auth?next=/onboarding");
  }

  const { data } = await sb
    .from("profiles")
    .select("onboarding_step, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (data?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  const step = (data?.onboarding_step as number | null) ?? 1;
  redirect(onboardingPathForStep(step));
}
