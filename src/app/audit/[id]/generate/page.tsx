"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Copy, Crown, FileText, Loader2 } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { useAuditOrRedirect } from "@/hooks/use-audit-loader";
import { useUserPlan } from "@/hooks/use-user-plan";
import { canAccessFeature } from "@/lib/plan-gates";
import { PlanGate } from "@/components/ui/plan-gate";
import { crumbsForPath } from "@/lib/nav-config";
import { GuidedFlowRail } from "@/components/audit/guided-flow-rail";
import {
  isGuidedFlowComplete,
  patchFlowState,
  type FlowStep,
} from "@/lib/workflow/flow-state";

interface GeneratedContent {
  title: string;
  description: string;
  faq: { q: string; a: string }[];
  metaDescription: string;
  adCopy: { platform: string; headline: string; body: string; cta: string }[];
  jsonLd?: Record<string, unknown>[];
  altTexts?: string[];
}

export default function GeneratePage() {
  const t = useT();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const auditId = params.id as string;
  const fromCustomerEye = searchParams.get("from") === "customerEye";

  const { audit, loading: auditLoading } = useAuditOrRedirect(auditId);
  const { plan: userPlan, loading: planLoading } = useUserPlan();
  const canGenerate = canAccessFeature(userPlan, "generate");
  // Content handed off from the customer-eye step is read synchronously at
  // mount so the effect below never has to set state for the cache hit.
  const [content, setContent] = React.useState<GeneratedContent | null>(() => {
    if (!fromCustomerEye || typeof window === "undefined") return null;
    try {
      const cached = sessionStorage.getItem(`gen:${auditId}`);
      return cached ? (JSON.parse(cached) as GeneratedContent) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = React.useState<string | null>(null);
  const startedRef = React.useRef(false);
  // Generation kicks off as soon as the audit is available, so "in flight"
  // is fully derived — no separate loading state to sync.
  const generating = Boolean(audit) && canGenerate && !planLoading && !content && !error;
  const [guided, setGuided] = React.useState(false);
  const [flowStep, setFlowStep] = React.useState<FlowStep>("generate");

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding");
        if (!res.ok) return;
        const data = await res.json();
        const ob = (data.onboarding as Record<string, string> | null) ?? null;
        if (cancelled) return;
        if (!isGuidedFlowComplete(ob)) {
          setGuided(true);
          void patchFlowState({ lastAuditId: auditId, flowStep: "generate" });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auditId]);

  React.useEffect(() => {
    if (!audit || planLoading || !canGenerate || startedRef.current) return;
    startedRef.current = true;

    if (content) {
      // Restored from the customer-eye handoff; consume the cache entry.
      try {
        sessionStorage.removeItem(`gen:${auditId}`);
      } catch {
        /* ignore */
      }
      return;
    }

    const customerEyeBlocker =
      fromCustomerEye && audit.customerEyeTest?.mainBlocker
        ? audit.customerEyeTest.mainBlocker
        : undefined;

    fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productUrl: audit.productUrl,
        auditId,
        auditContext: {
          overallScore: audit.overallScore,
          breakdown: audit.breakdown,
          recommendations: audit.recommendations,
          ...(customerEyeBlocker ? { customerEyeBlocker } : {}),
        },
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Generation failed");
        }
        return res.json();
      })
      .then((data) => {
        setContent(data.content);
      })
      .catch((err) => setError(err.message));
  }, [audit, auditId, content, fromCustomerEye, planLoading, canGenerate]);

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(t("generate.copied", { label }));
  };

  if (!planLoading && !canGenerate) {
    return (
      <PageShell>
        <PageHeader
          title={t("generate.title")}
          subtitle={t("generate.subtitle")}
          icon={Sparkles}
          back={`/audit/${auditId}/report`}
          crumbs={crumbsForPath(`/audit/${auditId}/generate`)}
        />
        <PageContent>
          <PlanGate plan={userPlan} feature="generate">{null}</PlanGate>
        </PageContent>
      </PageShell>
    );
  }

  if (auditLoading || planLoading || generating) {
    return (
      <PageShell>
        <PageContent className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {auditLoading ? "Loading audit..." : "Generating optimized content..."}
          </p>
        </PageContent>
      </PageShell>
    );
  }

  if (error || !content) {
    const isUpgrade = error?.includes("limit") || error?.includes("Upgrade");
    return (
      <PageShell>
        <PageContent className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center max-w-md mx-auto">
          <p className="text-sm text-rose-500">{error || "Failed to generate content."}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={() => router.back()} variant="outline" className="rounded-full">Go back</Button>
            {isUpgrade && (
              <Button asChild className="rounded-full shadow-glow">
                <Link href="/pricing"><Crown className="size-4 ml-1" /> Upgrade plan</Link>
              </Button>
            )}
            {!isUpgrade && (
              <Button onClick={() => { startedRef.current = false; window.location.reload(); }} className="rounded-full">Try again</Button>
            )}
          </div>
        </PageContent>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title={t("generate.title")}
        subtitle={t("generate.subtitle")}
        icon={Sparkles}
        back={`/audit/${auditId}/report`}
        crumbs={crumbsForPath(`/audit/${auditId}/generate`)}
        actions={
          <Badge className="gap-1 rounded-full gradient-brand text-white">
            <Crown className="size-3" /> {t("generate.pro")}
          </Badge>
        }
      />
      <PageContent className={guided ? "pb-28" : undefined}>
        <div id="guided-export" className="mb-4 flex justify-end gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              if (!canAccessFeature(userPlan, "pdf")) {
                toast.error(t("planGate.pdfDenied"));
                return;
              }
              window.open(`/api/audit/${auditId}/pdf`, "_blank");
            }}
          >
            <FileText className="size-4 ml-1" /> {t("guided.exportReport")}
          </Button>
        </div>
        <Tabs defaultValue="title" className="w-full">
          <TabsList className="flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="title" className="rounded-lg">{t("generate.titleTab")}</TabsTrigger>
            <TabsTrigger value="description" className="rounded-lg">{t("generate.descriptionTab")}</TabsTrigger>
            <TabsTrigger value="faq" className="rounded-lg">{t("generate.faqTab")}</TabsTrigger>
            <TabsTrigger value="meta" className="rounded-lg">{t("generate.metaTab")}</TabsTrigger>
            <TabsTrigger value="schema" className="rounded-lg">{t("generate.schemaTab")}</TabsTrigger>
            <TabsTrigger value="alt" className="rounded-lg">{t("generate.altTab")}</TabsTrigger>
            <TabsTrigger value="ad" className="rounded-lg">{t("generate.adTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="title" className="mt-4">
            <GenCard label={t("generate.optimizedTitle")} onCopy={() => copyText(content.title, t("generate.titleTab"))} copyLabel={t("generate.copy")}>
              <p className="text-base font-display font-semibold leading-relaxed">{content.title}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full text-xs">{t("generate.seoOptimized")}</Badge>
                <Badge variant="outline" className="rounded-full text-xs">{t("generate.geoFriendly")}</Badge>
                <Badge variant="outline" className="rounded-full text-xs">{t("generate.chars", { count: content.title.length })}</Badge>
              </div>
            </GenCard>
          </TabsContent>

          <TabsContent value="description" className="mt-4">
            <GenCard label={t("generate.benefitDesc")} onCopy={() => copyText(content.description, t("generate.descriptionTab"))} copyLabel={t("generate.copy")}>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">{content.description}</pre>
            </GenCard>
          </TabsContent>

          <TabsContent value="faq" className="mt-4 space-y-3">
            {content.faq.map((f, i) => (
              <GenCard key={i} label={f.q} onCopy={() => copyText(`Q: ${f.q}\nA: ${f.a}`, t("generate.question"))} copyLabel={t("generate.copy")}>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </GenCard>
            ))}
          </TabsContent>

          <TabsContent value="meta" className="mt-4">
            <GenCard label={t("generate.metaDesc")} onCopy={() => copyText(content.metaDescription, t("generate.metaTab"))} copyLabel={t("generate.copy")}>
              <p className="text-sm font-mono leading-relaxed">{content.metaDescription}</p>
              <div className="mt-2 text-xs text-muted-foreground">{t("generate.chars", { count: content.metaDescription.length })} · {t("generate.idealFor")}</div>
            </GenCard>
          </TabsContent>

          <TabsContent value="schema" className="mt-4">
            <GenCard
              label={t("generate.schemaTab")}
              onCopy={() => copyText(JSON.stringify(content.jsonLd ?? [], null, 2), t("generate.schemaTab"))}
              copyLabel={t("generate.copy")}
            >
              <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed bg-muted/40 rounded-lg p-4">
                {JSON.stringify(content.jsonLd ?? [], null, 2)}
              </pre>
            </GenCard>
          </TabsContent>

          <TabsContent value="alt" className="mt-4 space-y-3">
            {(content.altTexts ?? []).map((alt, i) => (
              <GenCard key={i} label={t("generate.altItem", { n: i + 1 })} onCopy={() => copyText(alt, t("generate.altTab"))} copyLabel={t("generate.copy")}>
                <p className="text-sm leading-relaxed">{alt}</p>
              </GenCard>
            ))}
            {(content.altTexts ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">{t("generate.noAlt")}</p>
            )}
          </TabsContent>

          <TabsContent value="ad" className="mt-4 space-y-3">
            {content.adCopy.map((ad, i) => (
              <GenCard key={i} label={ad.platform} onCopy={() => copyText(`${ad.headline}\n\n${ad.body}\n\nCTA: ${ad.cta}`, ad.platform)} copyLabel={t("generate.copy")}>
                <div className="text-base font-display font-bold">{ad.headline}</div>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{ad.body}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">CTA: {ad.cta}</div>
              </GenCard>
            ))}
          </TabsContent>
        </Tabs>
      </PageContent>
      {guided && (
        <GuidedFlowRail
          auditId={auditId}
          step={flowStep}
          onStepChange={setFlowStep}
        />
      )}
    </PageShell>
  );
}

function GenCard({ label, onCopy, copyLabel, children }: { label: string; onCopy: () => void; copyLabel: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5"><FileText className="size-4" /> {label}</h4>
        <Button size="sm" variant="ghost" onClick={onCopy} className="rounded-full h-7 px-2.5 text-xs shrink-0"><Copy className="size-3 ml-1" /> {copyLabel}</Button>
      </div>
      {children}
    </motion.div>
  );
}
