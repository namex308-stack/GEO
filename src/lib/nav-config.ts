import type { TranslationKey } from "@/lib/i18n";

export type NavSectionId =
  | "overview"
  | "analysis"
  | "tools"
  | "monitoring"
  | "account";

export type NavIconId =
  | "dashboard"
  | "newAudit"
  | "reports"
  | "history"
  | "aiCenter"
  | "contentImprover"
  | "watch"
  | "alerts"
  | "settings"
  | "usage"
  | "billing"
  | "pricing";

export interface NavItem {
  href: string;
  labelKey: TranslationKey;
  icon: NavIconId;
  match?: (pathname: string) => boolean;
}

export interface NavSection {
  id: NavSectionId;
  labelKey: TranslationKey;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "overview",
    labelKey: "nav.section.overview",
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard", icon: "dashboard" },
    ],
  },
  {
    id: "analysis",
    labelKey: "nav.section.analysis",
    items: [
      { href: "/audit/new", labelKey: "nav.newAudit", icon: "newAudit" },
      { href: "/reports", labelKey: "nav.reports", icon: "reports" },
      { href: "/history", labelKey: "nav.history", icon: "history" },
    ],
  },
  {
    id: "tools",
    labelKey: "nav.section.tools",
    items: [
      { href: "/ai", labelKey: "nav.aiCenter", icon: "aiCenter" },
      {
        href: "/tools/content-improver",
        labelKey: "nav.contentImprover",
        icon: "contentImprover",
      },
    ],
  },
  {
    id: "monitoring",
    labelKey: "nav.section.monitoring",
    items: [
      { href: "/watch", labelKey: "nav.websiteMonitoring", icon: "watch" },
      { href: "/watch/alerts", labelKey: "nav.notifications", icon: "alerts" },
    ],
  },
  {
    id: "account",
    labelKey: "nav.section.account",
    items: [
      { href: "/settings", labelKey: "nav.settings", icon: "settings" },
      { href: "/settings/usage", labelKey: "nav.usage", icon: "usage" },
      { href: "/settings/billing", labelKey: "nav.billing", icon: "billing" },
      { href: "/pricing", labelKey: "nav.pricing", icon: "pricing" },
    ],
  },
];

export interface Crumb {
  labelKey: TranslationKey;
  href?: string;
  /** Dynamic label override (e.g. report id) — skips i18n */
  label?: string;
}

/** Build breadcrumb trail for a pathname. Always starts with Dashboard. */
export function crumbsForPath(pathname: string, extras?: { reportId?: string }): Crumb[] {
  const dashboard: Crumb = { labelKey: "nav.dashboard", href: "/dashboard" };

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return [dashboard];
  }
  if (pathname === "/audit/new" || pathname.startsWith("/audit/new")) {
    return [dashboard, { labelKey: "nav.section.analysis" }, { labelKey: "nav.newAudit" }];
  }
  if (pathname.includes("/scanning")) {
    return [dashboard, { labelKey: "nav.section.analysis" }, { labelKey: "nav.scanning" }];
  }
  if (pathname.includes("/report")) {
    const id = extras?.reportId;
    return [
      dashboard,
      { labelKey: "nav.section.analysis", href: "/reports" },
      {
        labelKey: "nav.report",
        label: id ? `Report #${id.slice(0, 8)}` : undefined,
      },
    ];
  }
  if (pathname.includes("/compare")) {
    return [
      dashboard,
      { labelKey: "nav.section.analysis" },
      { labelKey: "nav.competitorAnalysis" },
    ];
  }
  if (pathname.includes("/generate")) {
    return [
      dashboard,
      { labelKey: "nav.section.tools", href: "/ai" },
      { labelKey: "nav.contentGenerator" },
    ];
  }
  if (pathname === "/reports" || pathname.startsWith("/reports/")) {
    return [dashboard, { labelKey: "nav.section.analysis" }, { labelKey: "nav.reports" }];
  }
  if (pathname === "/history" || pathname.startsWith("/history/")) {
    return [dashboard, { labelKey: "nav.section.analysis" }, { labelKey: "nav.history" }];
  }
  if (
    pathname === "/ai" ||
    pathname.startsWith("/ai/") ||
    pathname === "/ai-center" ||
    pathname.startsWith("/ai-center/")
  ) {
    return [dashboard, { labelKey: "nav.section.tools" }, { labelKey: "nav.aiCenter" }];
  }
  if (pathname === "/tools/content-improver") {
    return [
      dashboard,
      { labelKey: "nav.section.tools", href: "/ai" },
      { labelKey: "nav.contentImprover" },
    ];
  }
  if (pathname === "/watch/alerts" || pathname.startsWith("/watch/alerts")) {
    return [
      dashboard,
      { labelKey: "nav.section.monitoring", href: "/watch" },
      { labelKey: "nav.notifications" },
    ];
  }
  if (pathname.includes("/diff")) {
    return [
      dashboard,
      { labelKey: "nav.section.monitoring", href: "/watch" },
      { labelKey: "nav.watchDiff" },
    ];
  }
  if (pathname === "/watch" || pathname.startsWith("/watch/")) {
    return [
      dashboard,
      { labelKey: "nav.section.monitoring" },
      { labelKey: "nav.websiteMonitoring" },
    ];
  }
  if (pathname === "/settings/billing" || pathname.startsWith("/settings/billing")) {
    return [
      dashboard,
      { labelKey: "nav.section.account", href: "/settings" },
      { labelKey: "nav.billing" },
    ];
  }
  if (pathname === "/settings/usage" || pathname.startsWith("/settings/usage")) {
    return [
      dashboard,
      { labelKey: "nav.section.account", href: "/settings" },
      { labelKey: "nav.usage" },
    ];
  }
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return [dashboard, { labelKey: "nav.section.account" }, { labelKey: "nav.settings" }];
  }
  if (pathname === "/pricing") {
    return [dashboard, { labelKey: "nav.section.account" }, { labelKey: "nav.pricing" }];
  }

  return [dashboard];
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/watch") {
    return (
      pathname === "/watch" ||
      (pathname.startsWith("/watch/") && !pathname.startsWith("/watch/alerts"))
    );
  }
  if (href === "/settings") {
    return pathname === "/settings";
  }
  if (href === "/settings/billing") {
    return pathname === "/settings/billing" || pathname.startsWith("/settings/billing/");
  }
  if (href === "/settings/usage") {
    return pathname === "/settings/usage" || pathname.startsWith("/settings/usage/");
  }
  if (href === "/ai") {
    return pathname === "/ai" || pathname.startsWith("/ai/");
  }
  if (href === "/tools/content-improver") {
    return pathname === "/tools/content-improver";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
