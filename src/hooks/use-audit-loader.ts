"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getAudit, saveAudit } from "@/lib/audit-store";
import { mapDbAuditToAuditData } from "@/lib/audit/map-audit";
import type { AuditData } from "@/lib/types";

const subscribeToNothing = () => () => {};

/**
 * Load an audit from sessionStorage first, then GET /api/audit/[id].
 * Avoids redirecting to /audit/new after a refresh.
 *
 * The cache read is derived during render via useSyncExternalStore (server
 * snapshot is always null) rather than in a useState initializer or a
 * synchronous setState call inside an effect — this keeps the first client
 * render identical to the server-rendered loading state (no hydration
 * mismatch), then automatically re-renders with the real cache value right
 * after hydration. `loading` is likewise derived instead of tracked as its
 * own state, so it never needs a same-tick setState call in the effect body.
 */
export function useAuditLoader(auditId: string): {
  audit: AuditData | null;
  loading: boolean;
  error: string | null;
} {
  const mounted = React.useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const [fetchedAudit, setFetchedAudit] = React.useState<AuditData | null>(null);
  const [error, setError] = React.useState<string | null>(() =>
    auditId ? null : "Missing audit id"
  );

  // If the audit id changes while mounted, reset state during render
  // (React's recommended alternative to setState inside an effect).
  const [prevAuditId, setPrevAuditId] = React.useState(auditId);
  if (prevAuditId !== auditId) {
    setPrevAuditId(auditId);
    setFetchedAudit(null);
    setError(auditId ? null : "Missing audit id");
  }

  const cachedAudit = mounted && auditId ? getAudit(auditId) : null;
  const audit = fetchedAudit ?? cachedAudit;
  const loading = !!auditId && !audit && !error;

  React.useEffect(() => {
    // No id, or already satisfied from cache (see cachedAudit above).
    if (!auditId || getAudit(auditId)) return;

    let cancelled = false;

    fetch(`/api/audit/${auditId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Failed to load audit (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.audit) {
          const mapped = mapDbAuditToAuditData(data.audit);
          saveAudit(auditId, mapped);
          setFetchedAudit(mapped);
          setError(null);
        } else {
          throw new Error("Audit not found");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchedAudit(null);
        setError(err instanceof Error ? err.message : "Failed to load audit");
      });

    return () => {
      cancelled = true;
    };
  }, [auditId]);

  return { audit, loading, error };
}

/** Same as useAuditLoader but redirects to /audit/new on hard failure after load. */
export function useAuditOrRedirect(auditId: string) {
  const router = useRouter();
  const state = useAuditLoader(auditId);

  React.useEffect(() => {
    if (!state.loading && !state.audit && state.error) {
      router.replace("/audit/new");
    }
  }, [state.loading, state.audit, state.error, router]);

  return state;
}
