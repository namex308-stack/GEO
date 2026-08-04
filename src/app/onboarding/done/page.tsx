"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PageShell, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import {
  countryLabel,
  platformLabel,
} from "@/lib/onboarding/constants";

type DoneProfile = {
  businessName: string;
  storeUrl: string;
  platform: string;
  country: string;
  completed: boolean;
  resumePath: string;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-semibold text-end break-all">{value || "—"}</span>
    </div>
  );
}

export default function OnboardingDonePage() {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<DoneProfile | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding");
        if (res.status === 401) {
          router.replace("/auth?next=/onboarding/done");
          return;
        }
        const data = (await res.json()) as {
          onboarding?: DoneProfile;
        };
        if (cancelled) return;
        if (!data.onboarding?.completed) {
          router.replace(data.onboarding?.resumePath || "/onboarding");
          return;
        }
        setProfile({
          businessName: data.onboarding.businessName || "",
          storeUrl: data.onboarding.storeUrl || "",
          platform: data.onboarding.platform || "",
          country: data.onboarding.country || "",
          completed: true,
          resumePath: data.onboarding.resumePath || "/onboarding/done",
        });
      } catch {
        if (!cancelled) {
          router.replace("/onboarding");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !profile) {
    return (
      <PageShell>
        <PageContent className="max-w-md flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </PageContent>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContent className="max-w-lg text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 20 }}
        >
          <div className="mx-auto size-20 rounded-full gradient-brand grid place-items-center text-white shadow-glow-lg mb-6">
            <CheckCircle2 className="size-10" />
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
            {t("onboarding.done.ready")}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            {t("onboarding.done.readySub")}
          </p>

          <div className="mt-8 rounded-2xl border border-border/60 bg-card/60 px-5 text-start">
            <SummaryRow label={t("onboarding.done.businessName")} value={profile.businessName} />
            <SummaryRow label={t("onboarding.done.storeUrl")} value={profile.storeUrl} />
            <SummaryRow
              label={t("onboarding.done.detectedPlatform")}
              value={platformLabel(profile.platform)}
            />
            <SummaryRow label={t("onboarding.done.country")} value={countryLabel(profile.country)} />
            <SummaryRow label={t("onboarding.done.progress")} value="100%" />
          </div>

          <div className="mt-8 flex flex-col gap-2">
            <Button asChild className="rounded-full font-semibold h-12 shadow-glow">
              <Link href="/audit/new">{t("onboarding.done.startFirstAudit")}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full h-12">
              <Link href="/dashboard">{t("onboarding.done.exploreDashboard")}</Link>
            </Button>
          </div>
        </motion.div>
      </PageContent>
    </PageShell>
  );
}
