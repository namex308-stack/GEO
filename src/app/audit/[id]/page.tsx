import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Canonical audit entry — always open the report. */
export default async function AuditIdPage({ params }: PageProps) {
  const { id } = await params;
  if (!id || id === "demo") {
    redirect("/audit/new");
  }
  redirect(`/audit/${id}/report`);
}
