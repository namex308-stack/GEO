"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { getUserDisplayName, getUserInitials } from "@/lib/auth/display-user";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";

const NAV: readonly { labelKey: TranslationKey; target: string }[] = [
  { labelKey: "navbar.nav.product", target: "features" },
  { labelKey: "navbar.nav.how", target: "how" },
  { labelKey: "navbar.nav.methodology", target: "methodology" },
  { labelKey: "navbar.nav.security", target: "security" },
  { labelKey: "navbar.nav.pricing", target: "pricing" },
];

export function Navbar() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthed, user, loading, signOut } = useAuth();
  const { startAuditAndNavigate, openLoginAndNavigate } = useNavigateAfterAction();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [active, setActive] = React.useState<string | null>(null);
  const isHome = pathname === "/";

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setActive(id);
    setMobileOpen(false);
    if (!isHome) {
      router.push(`/#${id}`);
      return;
    }
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const showAuthed = mounted && !loading && isAuthed && user;
  const displayName = user ? getUserDisplayName(user) : "";
  const initials = user ? getUserInitials(user) : "";

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,box-shadow] duration-200",
        scrolled
          ? "glass border-b border-border/60 shadow-sm"
          : "bg-background/80 border-b border-transparent backdrop-blur-sm"
      )}
    >
      <nav
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
        aria-label={t("navbar.primaryNav")}
      >
        <Link
          href="/"
          className="flex items-center rounded-md focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("navbar.homeAriaLabel")}
        >
          <Logo />
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => scrollTo(item.target)}
              className={cn(
                "h-9 px-3 flex items-center text-sm font-medium rounded-md transition-colors",
                active === item.target
                  ? "text-foreground bg-accent/70"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={t("nav.toggleTheme")}
              className="size-9 rounded-md"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          )}

          {showAuthed ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex h-9 items-center gap-2 px-2 rounded-md hover:bg-accent/60 transition-colors"
              >
                <span className="size-7 rounded-full gradient-brand text-white text-xs font-bold grid place-items-center">
                  {initials}
                </span>
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {displayName.split(" ")[0]}
                </span>
              </Link>
              <Button size="sm" onClick={startAuditAndNavigate} className="h-9 px-4 font-semibold">
                {t("nav.newAudit")}
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openLoginAndNavigate()}
                className="hidden h-9 sm:inline-flex"
              >
                {t("navbar.login")}
              </Button>
              {!isHome && (
                <Button size="sm" onClick={startAuditAndNavigate} className="h-9 px-4 font-semibold">
                  {t("navbar.startFreeAudit")}
                </Button>
              )}
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-md lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      <div
        className={cn(
          "lg:hidden border-b border-border/60 overflow-hidden transition-all duration-200 bg-background/95 backdrop-blur",
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="px-4 py-4 space-y-1">
          {NAV.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => scrollTo(item.target)}
              className="block w-full text-start px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-md"
            >
              {t(item.labelKey)}
            </button>
          ))}
          <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
            {!showAuthed && (
              <Button
                variant="outline"
                onClick={() => {
                  setMobileOpen(false);
                  openLoginAndNavigate();
                }}
                className="w-full"
              >
                {t("navbar.login")}
              </Button>
            )}
            <Button
              onClick={() => {
                setMobileOpen(false);
                startAuditAndNavigate();
              }}
              className="w-full"
            >
              {t("navbar.startFreeAudit")}
            </Button>
            {showAuthed && (
              <Button
                variant="ghost"
                onClick={() => {
                  setMobileOpen(false);
                  void handleLogout();
                }}
                className="w-full"
              >
                {t("navbar.logout")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
