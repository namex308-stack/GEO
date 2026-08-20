"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, LogOut, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import {
  initialsFromDisplayName,
  resolvePreferredDisplayName,
} from "@/lib/auth/display-user";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  APP_NAV_FOOTER,
  APP_NAV_PRIMARY,
  isNavItemActive,
  resolveNavHref,
  type AppNavItem,
} from "@/lib/app-nav";

function NavLink({
  item,
  latestAuditId,
  onNavigate,
}: {
  item: AppNavItem;
  latestAuditId: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useT();
  const href = resolveNavHref(item, latestAuditId);
  const active = isNavItemActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="flex-1 truncate">{t(item.labelKey)}</span>
      {item.badge === "beta" && (
        <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
          {t("nav.beta")}
        </span>
      )}
    </Link>
  );
}

export function AppSidebar({
  latestAuditId,
  mobileOpen,
  onClose,
  preferredDisplayName = null,
  planName = null,
}: {
  latestAuditId: string | null;
  mobileOpen: boolean;
  onClose: () => void;
  preferredDisplayName?: string | null;
  planName?: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = React.useState(false);
  const displayName = resolvePreferredDisplayName(preferredDisplayName, user);
  const initials = displayName ? initialsFromDisplayName(displayName) : "?";

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      onClose();
      await signOut();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex h-[72px] items-center justify-between gap-2 px-5">
        <Link href="/dashboard" onClick={onClose} className="min-w-0">
          <Logo size={32} showTagline={false} />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={t("nav.closeMenu")}
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">
          {APP_NAV_PRIMARY.map((item) => (
            <NavLink
              key={item.id}
              item={item}
              latestAuditId={latestAuditId}
              onNavigate={onClose}
            />
          ))}
        </div>

        <div className="my-4 border-t border-border/60" />

        <div className="space-y-0.5">
          {APP_NAV_FOOTER.map((item) => (
            <NavLink
              key={item.id}
              item={item}
              latestAuditId={latestAuditId}
              onNavigate={onClose}
            />
          ))}
        </div>
      </nav>

      <div className="space-y-2 p-3 pt-0">
        {displayName ? (
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/40 px-3 py-2.5 transition-colors hover:border-primary/30 hover:bg-primary/[0.06]"
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold text-foreground">{displayName}</div>
              <p className="truncate text-[11px] text-muted-foreground">
                {planName ? t("dashboard.planBadge", { plan: planName }) : t("dashboard.account")}
              </p>
            </div>
          </Link>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          disabled={signingOut}
          onClick={() => void handleLogout()}
        >
          <LogOut className="size-[18px] shrink-0" />
          {t("nav.logout")}
        </Button>
        <Link
          href="/pricing"
          onClick={onClose}
          className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/40 p-3.5 transition-colors hover:border-primary/30 hover:bg-primary/[0.06]"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">{t("nav.upgradePlan")}</div>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {t("nav.upgradeHint")}
            </p>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <ArrowUpRight className="size-4" />
          </span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — logical start edge docks sidebar correctly in RTL */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[260px] border-e border-border/60 bg-card lg:flex lg:flex-col">
        {body}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-200",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <button
          type="button"
          className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]"
          aria-label={t("nav.closeMenu")}
          onClick={onClose}
        />
        <aside
          className={cn(
            "absolute inset-y-0 start-0 w-[min(288px,88vw)] bg-card shadow-[var(--shadow-elevated)] transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
          )}
        >
          {body}
        </aside>
      </div>
    </>
  );
}
