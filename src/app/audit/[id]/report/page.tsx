import { notFound, redirect } from "next/navigation";
import { AuditReport } from "@/components/app/audit-report";
import { getAuditByIdForUser } from "@/lib/db/audit-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;

  if (!id || id === "demo") {
    notFound();
  }

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

  const stored = await getAuditByIdForUser(id, user.id);
  if (!stored) {
    notFound();
  }

  return (
    <AuditReport
      audit={stored.audit}
      demoMode={stored.demoMode}
      aiConfigured={stored.aiConfigured}
    />
  );
}
