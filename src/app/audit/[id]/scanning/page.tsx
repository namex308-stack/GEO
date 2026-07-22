"use client";

import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FileSearch, Zap, Search, Bot, ShieldCheck, Cpu, Check, Loader2, AlertTriangle, Globe } from "lucide-react";
import { PageShell, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";
import { saveAudit } from "@/lib/audit-store";
import { mapDbAuditToAuditData } from "@/lib/audit/map-audit";
import { patchFlowState } from "@/lib/workflow/flow-state";

type PhaseIcon = typeof FileSearch;

const PHASES: { icon: PhaseIcon; labelKey: TranslationKey; detailKey: TranslationKey }[] = [
  { icon: FileSearch, labelKey: "scanning.reading", detailKey: "scanning.readingDetail" },
  { icon: Zap, labelKey: "scanning.conversion", detailKey: "scanning.conversionDetail" },
  { icon: Search, labelKey: "scanning.seo", detailKey: "scanning.seoDetail" },
  { icon: Bot, labelKey: "scanning.geo", detailKey: "scanning.geoDetail" },
  { icon: ShieldCheck, labelKey: "scanning.trust", detailKey: "scanning.trustDetail" },
  { icon: Cpu, labelKey: "scanning.recommendations", detailKey: "scanning.recommendationsDetail" },
];

const CRAWL_PHASES = [
  { icon: Globe, label: "Discovering pages", detail: "Scanning sitemap and site structure" },
  { icon: FileSearch, label: "Crawling site", detail: "Collecting all website pages" },
  { icon: Zap, label: "Analyzing pages", detail: "Running CRO, SEO, GEO & Trust engines" },
  { icon: Cpu, label: "Building report", detail: "Generating consolidated crawl report" },
];

export default function ScanningPage() {
  const t = useT();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const auditId = params.id as string;

  const productUrl = searchParams.get("productUrl");
  const fullCrawl = searchParams.get("fullCrawl") === "true";
  const siteUrl = searchParams.get("siteUrl") || searchParams.get("storeUrl") || productUrl;

  const [phase, setPhase] = React.useState(0);
  const [crawlProgress, setCrawlProgress] = React.useState({ total: 0, done: 0, message: "" });
  const [error, setError] = React.useState<string | null>(productUrl ? null : "No product URL provided.");
  const [crawlAuditId, setCrawlAuditId] = React.useState<string | null>(null);
  const apiDone = React.useRef(false);
  const auditResult = React.useRef<unknown>(null);
  const dbAuditId = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!productUrl) return;
    void patchFlowState({ lastAuditId: auditId, flowStep: "scanning" });
  }, [productUrl, auditId]);

  React.useEffect(() => {
    if (!productUrl) return;

    if (fullCrawl && siteUrl) {
      fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteUrl,
          storeUrl: searchParams.get("storeUrl") || undefined,
          productUrl,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Crawl failed (${res.status})`);
          }
          return res.json();
        })
        .then((data) => {
          dbAuditId.current = data.auditId;
          setCrawlAuditId(data.auditId);
        })
        .catch((err) => {
          setError(err.message || "Crawl failed. Please try again.");
        });
      return;
    }

    const body: Record<string, string> = { productUrl };
    const storeUrlParam = searchParams.get("storeUrl");
    const competitorUrl = searchParams.get("competitorUrl");
    if (storeUrlParam) body.storeUrl = storeUrlParam;
    if (competitorUrl) body.competitorUrl = competitorUrl;

    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Audit failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        auditResult.current = data.audit;
        dbAuditId.current = data.auditId ?? null;
        apiDone.current = true;
      })
      .catch((err) => {
        setError(err.message || "Audit failed. Please try again.");
      });
  }, [searchParams, productUrl, fullCrawl, siteUrl]);

  React.useEffect(() => {
    if (!fullCrawl || !crawlAuditId || error) return;

    const poll = setInterval(() => {
      fetch(`/api/crawl/${crawlAuditId}/progress`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          const progress = data.progress ?? {};
          setCrawlProgress({
            total: data.pagesTotal || progress.totalPages || 0,
            done: data.pagesComplete || progress.completedPages || 0,
            message: progress.message || progress.currentUrl || "",
          });

          if (progress.phase === "discovering") setPhase(0);
          else if (progress.phase === "crawling") setPhase(1);
          else if (progress.phase === "analyzing") setPhase(2);
          else if (progress.phase === "complete" || data.status === "complete") setPhase(3);

          if (data.status === "complete") {
            apiDone.current = true;
            fetch(`/api/audit/${crawlAuditId}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((auditData) => {
                if (auditData?.audit) {
                  auditResult.current = mapDbAuditToAuditData(auditData.audit);
                }
              })
              .catch(() => {});
          }

          if (data.status === "failed") {
            setError(data.error || "Crawl failed.");
          }
        })
        .catch(() => {});
    }, 1500);

    return () => clearInterval(poll);
  }, [fullCrawl, error, crawlAuditId]);

  React.useEffect(() => {
    if (error || fullCrawl) return;

    const timer = setInterval(() => {
      setPhase((p) => {
        if (p >= PHASES.length - 1) {
          clearInterval(timer);
          const waitForApi = () => {
            if (apiDone.current && auditResult.current) {
              const reportId = dbAuditId.current || auditId;
              saveAudit(reportId, auditResult.current as Parameters<typeof saveAudit>[1]);
              void patchFlowState({ lastAuditId: reportId, flowStep: "report" }).then(() => {
                router.replace(`/audit/${reportId}/report`);
              });
            } else if (!error) {
              setTimeout(waitForApi, 300);
            }
          };
          setTimeout(waitForApi, 500);
          return p;
        }
        return p + 1;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [auditId, router, error, fullCrawl]);

  React.useEffect(() => {
    if (!fullCrawl || error) return;

    const check = setInterval(() => {
      if (apiDone.current && auditResult.current) {
        const reportId = dbAuditId.current || auditId;
        saveAudit(reportId, auditResult.current as Parameters<typeof saveAudit>[1]);
        void patchFlowState({ lastAuditId: reportId, flowStep: "report" }).then(() => {
          router.replace(`/audit/${reportId}/report`);
        });
      }
    }, 500);

    return () => clearInterval(check);
  }, [fullCrawl, auditId, router, error]);

  const progressPct = crawlProgress.total > 0
    ? Math.round((crawlProgress.done / crawlProgress.total) * 100)
    : phase * 25;

  if (error) {
    return (
      <PageShell>
        <PageContent className="max-w-xl">
          <div className="text-center py-20">
            <AlertTriangle className="size-12 text-rose-500 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Audit Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push("/audit/new")} className="rounded-full">Try Again</Button>
          </div>
        </PageContent>
      </PageShell>
    );
  }

  const phases = fullCrawl ? CRAWL_PHASES : PHASES.map((p) => ({ icon: p.icon, label: t(p.labelKey), detail: t(p.detailKey) }));

  return (
    <PageShell>
      <PageContent className="max-w-xl">
        <div className="text-center mb-10">
          <div className="mx-auto size-16 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow mb-5 relative">
            {fullCrawl ? <Globe className="size-8" /> : <Cpu className="size-8" />}
            <span className="absolute inset-0 rounded-2xl border-2 border-primary/40 animate-pulse-ring" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">
            {fullCrawl ? "Crawling your website" : t("scanning.analyzing")}
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            {fullCrawl ? crawlProgress.message || "This may take a few minutes" : t("scanning.takesTime")}
          </p>
          {fullCrawl && crawlProgress.total > 0 && (
            <div className="mt-4 max-w-sm mx-auto space-y-2">
              <Progress value={progressPct} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {crawlProgress.done} / {crawlProgress.total} pages analyzed
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          {phases.map((p, i) => {
            const done = i < phase;
            const active = i === phase;
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{ opacity: i <= phase ? 1 : 0.4, scale: active ? 1.01 : 1 }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3.5 transition-colors",
                  done && "border-primary/30 bg-primary/5",
                  active && "border-primary/50 bg-primary/10 shadow-glow",
                  !done && !active && "border-border/50 bg-card"
                )}
              >
                <span className={cn(
                  "size-9 rounded-lg grid place-items-center shrink-0",
                  done && "bg-primary/15 text-primary",
                  active && "gradient-brand text-white",
                  !done && !active && "bg-muted text-muted-foreground"
                )}>
                  {done ? <Check className="size-4" /> : active ? <Loader2 className="size-4 animate-spin" /> : <p.icon className="size-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{p.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.detail}</div>
                </div>
                {active && (
                  <div className="flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <motion.span key={d} className="size-1.5 rounded-full bg-primary" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }} />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </PageContent>
    </PageShell>
  );
}
