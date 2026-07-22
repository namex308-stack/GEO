"use client";

import * as React from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { PlanId } from "@/lib/billing/plans";
import { resolveEffectivePlan } from "@/lib/billing/dev-unlock";

export function useUserPlan(): { plan: PlanId; loading: boolean } {
  const sb = React.useMemo(() => getSupabaseBrowser(), []);
  const [plan, setPlan] = React.useState<PlanId>(() => resolveEffectivePlan("free"));
  const [loading, setLoading] = React.useState(!!sb);

  React.useEffect(() => {
    // No client: initial state already has plan=free and loading=false.
    if (!sb) return;

    let cancelled = false;

    (async () => {
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) {
          if (!cancelled) {
            setPlan(resolveEffectivePlan("free"));
            setLoading(false);
          }
          return;
        }

        const { data } = await sb.from("profiles").select("plan").eq("id", user.id).single();
        if (!cancelled) {
          setPlan(resolveEffectivePlan((data?.plan as PlanId) ?? "free"));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPlan(resolveEffectivePlan("free"));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sb]);

  return { plan, loading };
}
