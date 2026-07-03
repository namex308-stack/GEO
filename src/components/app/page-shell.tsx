"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, Menu, X, ChevronLeft, Languages } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useLanguageStore, useLanguage } from "@/lib/language-store";

const NAV = [
  { href: "/dashboard", key: "nav.dashboard" as const },
  { href: "/audit/new", key: "nav.newAudit" as const },
  { href: "/history", key: "nav.history" as const },
  { href: "/watch", key: "nav.watch" as const },
  { href: "/settings", key: "nav.settings" as const },
];

export function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const t = useT();
  const { language, dir } = useLanguage();
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage);
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={dir} lang={language}>
      {/* Navbar */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled ? "glass border-b border-border/60 shadow-sm" : "bg-transparent border-b border-transparent"
        )}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <Logo />
            </Link>
            <div className="hidden lg:flex items-center gap-1">
              {NAV.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3.5 py-2 text-sm font-medium rounded-lg transition-colors",
                      active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    )}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="rounded-full gap-1.5 font-semibold"
              aria-label="Switch language"
            >
              <Languages className="size-4" />
              {language === "en" ? "AR" : "EN"}
            </Button>
            {mounted && (
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-full" aria-label={t("nav.toggleTheme")}>
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            )}
            <Button asChild size="sm" className="rounded-full font-semibold shadow-glow hidden sm:inline-flex">
              <Link href="/audit/new">{t("nav.newAudit")}</Link>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden rounded-full" onClick={() => setMobileOpen((v) => !v)} aria-label={t("nav.menu")}>
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </nav>
        {/* Mobile menu */}
        <div className={cn(
          "lg:hidden glass border-b border-border/60 overflow-hidden transition-all duration-300",
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}>
          <div className="px-4 py-4 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block w-full px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg",
                  dir === "rtl" ? "text-right" : "text-left"
                )}
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="pt-2 border-t border-border/60">
              <Button asChild className="rounded-full w-full">
                <Link href="/audit/new">{t("nav.newAudit")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col pt-16">{children}</main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/"><Logo /></Link>
            <p className="text-xs text-muted-foreground">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link href="/docs" className="hover:text-foreground">{t("footer.docs")}</Link>
              <Link href="/blog" className="hover:text-foreground">{t("footer.blog")}</Link>
              <Link href="/pricing" className="hover:text-foreground">{t("footer.pricing")}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({
  title, subtitle, icon: Icon, actions, back,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  back?: string;
}) {
  const { dir } = useLanguage();
  const t = useT();
  return (
    <div className="border-b border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {back && (
          <Link href={back} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
            <ChevronLeft className={cn("size-4", dir === "rtl" && "rotate-180")} />
            {t("footer.back")}
          </Link>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <span className="size-12 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow shrink-0">
                <Icon className="size-6" />
              </span>
            )}
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function PageContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full", className)}>
      {children}
    </div>
  );
}
