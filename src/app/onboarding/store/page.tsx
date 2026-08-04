import { redirect } from "next/navigation";

/** Legacy quiz URL → first onboarding question. */
export default function LegacyStoreRedirect() {
  redirect("/onboarding/business-name");
}
