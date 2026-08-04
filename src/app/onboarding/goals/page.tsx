import { redirect } from "next/navigation";

/** Legacy quiz URL → enterprise challenge step. */
export default function LegacyGoalsRedirect() {
  redirect("/onboarding/challenge");
}
