"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanSearch,
  FileText,
  History,
  Bot,
  Wand2,
  Eye,
  Bell,
  Settings,
  Gauge,
  CreditCard,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  NAV_SECTIONS,
  isNavItemActive,
  type NavIconId,
} from "@/lib/nav-config";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<NavIconId, LucideIcon> = {
  dashboard: LayoutDashboard,
  newAudit: ScanSearch,
  reports: FileText,
  history: History,
  aiCenter: Bot,
  contentImprover: Wand2,
  watch: Eye,
  alerts: Bell,
  settings: Settings,
  usage: Gauge,
  billing: CreditCard,
  pricing: Crown,
};

export function AppSidebar() {
  const pathname = usePathname();
  const t = useT();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <Logo className="h-7" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1 py-2">
        {NAV_SECTIONS.map((section, index) => (
          <React.Fragment key={section.id}>
            {index === NAV_SECTIONS.length - 1 ? (
              <SidebarSeparator className="mx-2 my-1" />
            ) : null}
            <SidebarGroup className="py-1">
              <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {t(section.labelKey)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const active = isNavItemActive(pathname, item.href);
                    const Icon = NAV_ICONS[item.icon];
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={t(item.labelKey)}
                          className={cn(
                            "h-9 px-2.5 text-sm font-medium rounded-lg transition-colors",
                            active
                              ? "text-primary bg-primary/10 hover:bg-primary/15 hover:text-primary"
                              : "text-sidebar-foreground/80 hover:text-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <Link href={item.href}>
                            <Icon className="size-4 shrink-0" />
                            <span>{t(item.labelKey)}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </React.Fragment>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 group-data-[collapsible=icon]:hidden">
        <p className="px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
          {t("nav.sidebar.footer")}
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
