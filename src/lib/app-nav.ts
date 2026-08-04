import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  CreditCard,
  Settings,
  HelpCircle,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

export type AppNavId =
  | "dashboard"
  | "new-audit"
  | "history"
  | "reports"
  | "billing"
  | "settings"
  | "help";

export type AppNavItem = {
  id: AppNavId;
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  badge?: "beta";
  /** Resolve href from latest completed audit when available */
  fromLatest?: "report";
};

export const APP_NAV_PRIMARY: AppNavItem[] = [
  {
    id: "dashboard",
    href: "/dashboard",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "new-audit",
    href: "/audit/new",
    labelKey: "nav.newAudit",
    icon: PlusCircle,
  },
  {
    id: "history",
    href: "/history",
    labelKey: "nav.history",
    icon: History,
  },
  {
    id: "reports",
    href: "/history",
    labelKey: "nav.reports",
    icon: FileText,
    fromLatest: "report",
  },
];

export const APP_NAV_FOOTER: AppNavItem[] = [
  {
    id: "billing",
    href: "/settings/billing",
    labelKey: "nav.billing",
    icon: CreditCard,
  },
  {
    id: "settings",
    href: "/settings",
    labelKey: "nav.settings",
    icon: Settings,
  },
  {
    id: "help",
    href: "/docs",
    labelKey: "nav.helpCenter",
    icon: HelpCircle,
  },
];

export const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/audit",
  "/history",
  "/settings",
  "/onboarding",
] as const;

export function isAppShellRoute(pathname: string): boolean {
  return APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function resolveNavHref(
  item: AppNavItem,
  latestAuditId: string | null
): string {
  if (!item.fromLatest || !latestAuditId) return item.href;
  switch (item.fromLatest) {
    case "report":
      return `/audit/${latestAuditId}/report`;
    default: {
      const _exhaustive: never = item.fromLatest;
      return _exhaustive;
    }
  }
}

export function isNavItemActive(pathname: string, item: AppNavItem): boolean {
  switch (item.id) {
    case "dashboard":
      return pathname === "/dashboard";
    case "new-audit":
      return pathname === "/audit/new" || /\/audit\/[^/]+\/scanning$/.test(pathname);
    case "history":
      return pathname === "/history" || pathname.startsWith("/history/");
    case "reports":
      return false;
    case "billing":
      return pathname.startsWith("/settings/billing");
    case "settings":
      return pathname === "/settings";
    case "help":
      return pathname.startsWith("/docs");
    default: {
      const _exhaustive: never = item.id;
      return _exhaustive;
    }
  }
}
