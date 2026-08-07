import { redirect } from "next/navigation";
import { getAuditAccessForUser } from "@/lib/db/audit-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAuditInProgress, isPlaceholderAuditId } from "@/lib/audits/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Canonical audit entry — route by lifecycle status. */
export default async function AuditIdPage({ params }: PageProps) {
  const { id } = await params;
  if (!id || isPlaceholderAuditId(id)) {
    redirect("/audit/new");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(`/auth?next=${encodeURIComponent(`/audit/${id}`)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/audit/${id}`)}`);
  }

  const meta = await getAuditAccessForUser(id, user.id);
  if (!meta) {
    redirect("/history");
  }

  if (isAuditInProgress(meta.status) || meta.status === "failed") {
    redirect(`/audit/${id}/scanning`);
  }

  redirect(`/audit/${id}/report`);
}
