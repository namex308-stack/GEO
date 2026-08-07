"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/providers/auth-provider";
import { getUserDisplayName, getUserInitials } from "@/lib/auth/display-user";
import { useT } from "@/lib/i18n";

function greetingKey(hour: number): "dashboard.goodMorning" | "dashboard.goodAfternoon" | "dashboard.goodEvening" {
  if (hour < 12) return "dashboard.goodMorning";
  if (hour < 18) return "dashboard.goodAfternoon";
  return "dashboard.goodEvening";
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || full;
}

export function AppTopbar({
  planName,
  notificationCount = 0,
  preferredDisplayName = null,
  onMenuOpen,
  compactGreeting = false,
}: {
  planName?: string | null;
  notificationCount?: number;
  /** Kept for shell payload compatibility; bell links to /alerts. */
  latestAuditId?: string | null;
  preferredDisplayName?: string | null;
  onMenuOpen: () => void;
  compactGreeting?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [hour, setHour] = React.useState(() => new Date().getHours());
  const [query, setQuery] = React.useState("");
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setHour(new Date().getHours());
  }, []);

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const authName = user ? getUserDisplayName(user) : "";
  const displayName = (preferredDisplayName?.trim() || authName).trim();
  const initials = displayName
    ? displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0] ?? "")
        .join("")
        .toUpperCase() || "?"
    : user
      ? getUserInitials(user)
      : "?";
  const avatarUrl =
    (typeof user?.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url) ||
    (typeof user?.user_metadata?.picture === "string" && user.user_metadata.picture) ||
    "";
  const greetName = firstName(displayName) || "بك";
  const badge = Math.max(0, notificationCount);
  const issuesHref = "/notifications";

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/history?q=${encodeURIComponent(q)}` : "/history");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/85 backdrop-blur-md">
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden rounded-xl shrink-0"
          onClick={onMenuOpen}
          aria-label={t("nav.menu")}
        >
          <Menu className="size-5" />
        </Button>

        {!compactGreeting && (
          <div className="min-w-0 hidden sm:block lg:max-w-[240px] xl:max-w-none">
            <h1 className="font-display text-lg font-bold tracking-tight truncate">
              {t(greetingKey(hour), { name: greetName })}
            </h1>
            <p className="text-xs text-muted-foreground truncate">{t("dashboard.subtitle")}</p>
          </div>
        )}

        <div className="flex-1 flex justify-center min-w-0 px-1">
          <form onSubmit={submitSearch} className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground start-3" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("dashboard.searchPlaceholder")}
              className="h-10 w-full rounded-xl border border-border/60 bg-card ps-10 pe-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
              aria-label={t("dashboard.searchPlaceholder")}
            />
          </form>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full hidden sm:inline-flex"
              aria-label={t("nav.toggleTheme")}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          )}

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative rounded-full"
          >
            <Link
              href={issuesHref}
              aria-label={
                badge > 0
                  ? `${t("notifications.title")}: ${badge}`
                  : t("dashboard.notifications")
              }
              title={t("notifications.title")}
            >
              <Bell className="size-[18px]" />
              {badge > 0 && (
                <span className="absolute top-1 end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-white">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          </Button>

          <Link
            href="/settings"
            className="hidden md:flex items-center gap-2.5 rounded-full border border-border/50 bg-card py-1.5 pe-3 ps-1.5 hover:border-primary/30 transition-colors"
          >
            <Avatar className="size-8">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-semibold truncate max-w-[120px]">
                {displayName || t("dashboard.account")}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {planName ? t("dashboard.planBadge", { plan: planName }) : t("dashboard.free")}
              </div>
            </div>
            <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            disabled={signingOut}
            onClick={() => void handleLogout()}
            aria-label={t("nav.logout")}
            title={t("nav.logout")}
          >
            <LogOut className="size-[18px]" />
          </Button>

          <Button asChild className="rounded-full font-semibold shadow-glow h-10 px-3 sm:px-4">
            <Link href="/audit/new">
              <span className="hidden sm:inline">{t("dashboard.newAudit")}</span>
              <Plus className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
