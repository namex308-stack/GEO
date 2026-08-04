"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Copy, Crown, FileText, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { PageShell, PageHeader, PageContent } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import type { GeneratedContent } from "@/lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; content: GeneratedContent; source: string }
  | { status: "error"; message: string };

export default function GeneratePage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const auditId = params?.id ?? "";
  const [state, setState] = React.useState<LoadState>({ status: "loading" });

  const load = React.useCallback(async () => {
    setState({ status: "loading" });
    if (!auditId || auditId === "demo") {
      setState({ status: "error", message: t("generate.openFromReport") });
      return;
    }
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, locale: "ar" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        content?: GeneratedContent;
        source?: string;
      };
      if (!res.ok || !data.content) {
        setState({
          status: "error",
          message: data.error || t("generate.contentError"),
        });
        return;
      }
      setState({
        status: "ready",
        content: data.content,
        source: data.source || data.content.source || "page",
      });
    } catch {
      setState({ status: "error", message: t("generate.generationFailed") });
    }
  }, [auditId, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(t("generate.copied", { label }));
  };

  const backHref = `/audit/${auditId}/report`;

  return (
    <PageShell>
      <PageHeader
        title={t("generate.title")}
        subtitle={t("generate.subtitle")}
        icon={Sparkles}
        back={backHref}
        actions={
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => void load()}>
            <RefreshCw className="size-4 me-1" /> {t("generate.regenerate")}
          </Button>
        }
      />
      <PageContent className="max-w-3xl space-y-6">
        {state.status === "loading" && (
          <div className="py-16 text-center">
            <Loader2 className="size-8 animate-spin mx-auto text-primary" />
          </div>
        )}

        {state.status === "error" && (
          <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
            <AlertTriangle className="size-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{state.message}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button className="rounded-full" onClick={() => void load()}>
                {t("generate.tryAgain")}
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/audit/new">{t("compare.newAudit")}</Link>
              </Button>
            </div>
          </div>
        )}

        {state.status === "ready" && (
          <>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-full">
                {state.source === "gemini" ? t("generate.geminiSource") : t("generate.pageSource")}
              </Badge>
              <Badge className="rounded-full bg-primary/10 text-primary border-0">
                <Crown className="size-3 me-1" /> {t("generate.savedToAudit")}
              </Badge>
            </div>

            <Tabs defaultValue="copy" className="w-full">
              <TabsList className="rounded-full">
                <TabsTrigger value="copy" className="rounded-full">
                  <FileText className="size-3.5 me-1" /> {t("generate.copy")}
                </TabsTrigger>
                <TabsTrigger value="faq" className="rounded-full">
                  {t("generate.faqTab")}
                </TabsTrigger>
                <TabsTrigger value="ads" className="rounded-full">
                  {t("generate.adTab")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="copy" className="mt-4 space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/60 bg-card p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-muted-foreground">{t("generate.titleTab")}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8"
                      onClick={() => copyText(state.content.title, t("generate.titleTab"))}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm font-semibold">{state.content.title}</p>
                </motion.div>
                <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-muted-foreground">{t("generate.descriptionTab")}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8"
                      onClick={() => copyText(state.content.description, t("generate.descriptionTab"))}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {state.content.description}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-muted-foreground">{t("generate.metaDesc")}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full h-8"
                      onClick={() => copyText(state.content.metaDescription, t("generate.metaTab"))}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{state.content.metaDescription}</p>
                </div>
              </TabsContent>

              <TabsContent value="faq" className="mt-4 space-y-3">
                {state.content.faq.map((f, i) => (
                  <div key={i} className="rounded-2xl border border-border/60 bg-card p-5">
                    <div className="font-semibold text-sm">{f.q}</div>
                    <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="ads" className="mt-4 space-y-3">
                {state.content.adCopy.map((ad, i) => (
                  <div key={i} className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
                    <Badge variant="outline" className="rounded-full">
                      {ad.platform}
                    </Badge>
                    <div className="font-semibold text-sm">{ad.headline}</div>
                    <p className="text-sm text-muted-foreground">{ad.body}</p>
                    <div className="text-xs font-medium text-primary">{ad.cta}</div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </PageContent>
    </PageShell>
  );
}
