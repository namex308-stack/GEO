import { redirect } from "next/navigation";

/** Legacy quiz URL → optional competitor (last) step. */
export default function LegacyGoalsRedirect() {
  redirect("/onboarding/competitor");
}
