"use client";

import Link from "next/link";
import {
  FileText,
  History,
  Bot,
  Swords,
  Eye,
  CreditCard,
  PlayCircle,
  PlusCircle,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface QuickActionsProps {
  lastAuditId?: string | null;
  lastAuditStatus?: string | null;
  hasCompetitor?: boolean;
  className?: string;
}

export function QuickActions({
  lastAuditId,
  lastAuditStatus,
  hasCompetitor,
  className,
}: QuickActionsProps) {
  const t = useT();

  const continueHref = lastAuditId
    ? lastAuditStatus && lastAuditStatus !== "complete"
      ? `/audit/${lastAuditId}/scanning`
      : `/audit/${lastAuditId}/report`
    : "/audit/new";

  const competitorHref =
    lastAuditId && hasCompetitor
      ? `/audit/${lastAuditId}/compare`
      : "/audit/new";

  const actions = [
    { href: "/audit/new", label: t("qa.newAudit"), icon: PlusCircle },
    { href: continueHref, label: t("qa.continueLast"), icon: PlayCircle },
    { href: "/reports", label: t("qa.reports"), icon: FileText },
    { href: "/ai", label: t("qa.aiCenter"), icon: Bot },
    { href: competitorHref, label: t("qa.competitor"), icon: Swords },
    { href: "/watch", label: t("qa.monitoring"), icon: Eye },
    { href: "/history", label: t("qa.history"), icon: History },
    { href: "/settings/billing", label: t("qa.billing"), icon: CreditCard },
  ];

  return (
    <div className={cn("grid sm:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {actions.map((a) => (
        <Link
          key={a.label + a.href}
          href={a.href}
          className="rounded-2xl border border-border/60 bg-card p-5 hover:bg-accent/40 transition-colors group"
        >
          <span className="size-9 rounded-lg grid place-items-center bg-primary/10 text-primary mb-3">
            <a.icon className="size-5" />
          </span>
          <div className="text-sm font-semibold group-hover:text-primary transition-colors">
            {a.label}
          </div>
        </Link>
      ))}
    </div>
  );
}
