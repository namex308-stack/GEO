import { notFound, redirect, unstable_rethrow } from "next/navigation";
import { AuditReport } from "@/components/app/audit-report";
import { getAuditByIdForUser } from "@/lib/db/audit-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAuditInProgress, isPlaceholderAuditId } from "@/lib/audits/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;

  if (!id || isPlaceholderAuditId(id)) {
    notFound();
  }

  let stored: Awaited<ReturnType<typeof getAuditByIdForUser>>;
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      redirect(`/auth?next=${encodeURIComponent(`/audit/${id}/report`)}`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/auth?next=${encodeURIComponent(`/audit/${id}/report`)}`);
    }

    stored = await getAuditByIdForUser(id, user.id);
  } catch (err) {
    // Preserve notFound()/redirect() control-flow errors for the App Router.
    unstable_rethrow(err);
    console.error("[audit/report] failed to load report:", err);
    throw new Error("تعذّر تحميل تقرير التحليل. حاول مرة أخرى.");
  }

  if (!stored) {
    notFound();
  }

  const status = stored.audit.status;
  if (status && (isAuditInProgress(status) || status === "failed")) {
    redirect(`/audit/${id}/scanning`);
  }

  return (
    <AuditReport
      audit={stored.audit}
      demoMode={stored.demoMode}
      aiConfigured={stored.aiConfigured}
    />
  );
}
