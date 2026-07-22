"use client";

import * as React from "react";
import Link from "next/link";
import { Bot, Sparkles, Wand2, ArrowRight } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { crumbsForPath } from "@/lib/nav-config";
import {
  readLastAuditIdFromLocalStorage,
} from "@/lib/workflow/flow-state";

// localStorage never notifies of changes here; we only need a one-time,
// hydration-safe read (server snapshot is always null).
const subscribeToNothing = () => () => {};
const getServerAuditId = () => null;

export default function AiCenterPage() {
  const t = useT();
  const localAuditId = React.useSyncExternalStore(
    subscribeToNothing,
    readLastAuditIdFromLocalStorage,
    getServerAuditId
  );
  const [profileAuditId, setProfileAuditId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (localAuditId) return;
    let cancelled = false;
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.profile?.lastAuditId) {
          setProfileAuditId(data.profile.lastAuditId);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [localAuditId]);

  const lastAuditId = localAuditId ?? profileAuditId;

  return (
    <PageShell>
      <PageHeader
        title={t("aiCenter.title")}
        subtitle={t("aiCenter.subtitle")}
        icon={Bot}
        back="/dashboard"
        crumbs={crumbsForPath("/ai")}
      />
      <PageContent className="space-y-6 max-w-3xl">
        {!lastAuditId ? (
          <EmptyState
            title={t("empty.noAi")}
            ctaLabel={t("empty.noAi.cta")}
            ctaHref="/audit/new"
          />
        ) : null}

        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/tools/content-improver"
            className="rounded-2xl border border-border/60 bg-card p-6 hover:bg-accent/40 transition-colors"
          >
            <span className="size-10 rounded-xl grid place-items-center bg-primary/10 text-primary mb-3">
              <Wand2 className="size-5" />
            </span>
            <h2 className="font-display text-lg font-bold">{t("aiCenter.contentImprover")}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("aiCenter.contentImproverDesc")}
            </p>
            <span className="inline-flex items-center text-sm font-semibold text-primary mt-4">
              {t("aiCenter.open")} <ArrowRight className="size-4 ml-1" />
            </span>
          </Link>

          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <span className="size-10 rounded-xl grid place-items-center bg-primary/10 text-primary mb-3">
              <Sparkles className="size-5" />
            </span>
            <h2 className="font-display text-lg font-bold">{t("aiCenter.generate")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("aiCenter.generateDesc")}</p>
            {lastAuditId ? (
              <Button asChild className="mt-4 rounded-full shadow-glow">
                <Link href={`/audit/${lastAuditId}/generate`}>
                  {t("guided.generateContent")} <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground mt-4">{t("aiCenter.needAudit")}</p>
            )}
          </div>

          {lastAuditId ? (
            <Link
              href={`/audit/${lastAuditId}/report#guided-customer-eye`}
              className="rounded-2xl border border-border/60 bg-card p-6 hover:bg-accent/40 transition-colors"
            >
              <span className="size-10 rounded-xl grid place-items-center bg-primary/10 text-primary mb-3">
                <Bot className="size-5" />
              </span>
              <h2 className="font-display text-lg font-bold">{t("aiCenter.customerEye")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("aiCenter.customerEyeDesc")}
              </p>
              <span className="inline-flex items-center text-sm font-semibold text-primary mt-4">
                {t("aiCenter.open")} <ArrowRight className="size-4 ml-1" />
              </span>
            </Link>
          ) : null}

          {lastAuditId ? (
            <Link
              href={`/audit/${lastAuditId}/compare`}
              className="rounded-2xl border border-border/60 bg-card p-6 hover:bg-accent/40 transition-colors"
            >
              <span className="size-10 rounded-xl grid place-items-center bg-primary/10 text-primary mb-3">
                <Sparkles className="size-5" />
              </span>
              <h2 className="font-display text-lg font-bold">{t("aiCenter.competitor")}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("aiCenter.competitorDesc")}
              </p>
              <span className="inline-flex items-center text-sm font-semibold text-primary mt-4">
                {t("aiCenter.open")} <ArrowRight className="size-4 ml-1" />
              </span>
            </Link>
          ) : null}
        </div>
      </PageContent>
    </PageShell>
  );
}
