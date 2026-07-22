"use client";

import * as React from "react";
import { Loader2, Wand2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { ContentImprover } from "@/components/audit/content-improver";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { PlanId } from "@/lib/billing/plans";
import { resolveEffectivePlan } from "@/lib/billing/dev-unlock";
import { crumbsForPath } from "@/lib/nav-config";

export default function ContentImproverPage() {
  const sb = React.useMemo(() => getSupabaseBrowser(), []);
  const [plan, setPlan] = React.useState<PlanId>(() => resolveEffectivePlan("free"));
  const [loading, setLoading] = React.useState(!!sb);

  React.useEffect(() => {
    if (!sb) return;

    let cancelled = false;

    (async () => {
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (cancelled) return;
        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await sb.from("profiles").select("plan").eq("id", user.id).single();
        if (cancelled) return;
        setPlan(resolveEffectivePlan((data?.plan as PlanId) ?? "free"));
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sb]);

  return (
    <PageShell>
      <PageHeader
        title="Content Improver"
        subtitle="AI-powered copy rewriting for product titles and descriptions"
        icon={Wand2}
        back="/dashboard"
        crumbs={crumbsForPath("/tools/content-improver")}
      />
      <PageContent>
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <ContentImprover userPlan={plan} />
        )}
      </PageContent>
    </PageShell>
  );
}
