"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, ChevronLeft, Languages, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/sign-out";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useLanguageStore, useLanguage } from "@/lib/language-store";
import { useMounted } from "@/hooks/use-mounted";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppBreadcrumb } from "@/components/app/app-breadcrumb";
import type { Crumb } from "@/lib/nav-config";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/** Minimal shell for auth pages — no navbar or footer. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const { language, dir } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={dir} lang={language}>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const t = useT();
  const { language, dir } = useLanguage();
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const mounted = useMounted();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={dir} lang={language}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
                aria-label={t("nav.toggleTheme")}
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full hidden sm:inline-flex text-muted-foreground hover:text-rose-500"
            >
              <LogOut className="size-4 ml-1" />
              {t("nav.logout")}
            </Button>
          </header>

          <main className="flex-1 flex flex-col">{children}</main>

          <footer className="mt-auto border-t border-border/60 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link href="/">
                  <Logo />
                </Link>
                <p className="text-xs text-muted-foreground">
                  {t("footer.copyright", { year: new Date().getFullYear() })}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <Link href="/docs" className="hover:text-foreground">
                    {t("footer.docs")}
                  </Link>
                  <Link href="/blog" className="hover:text-foreground">
                    {t("footer.blog")}
                  </Link>
                  <Link href="/pricing" className="hover:text-foreground">
                    {t("footer.pricing")}
                  </Link>
                  <Link href="/contact" className="hover:text-foreground">
                    {t("footer.link.contact")}
                  </Link>
                  <Link href="/privacy" className="hover:text-foreground">
                    {t("footer.link.privacy")}
                  </Link>
                  <Link href="/terms" className="hover:text-foreground">
                    {t("footer.link.terms")}
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  back,
  crumbs,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  back?: string;
  crumbs?: Crumb[];
}) {
  const { dir } = useLanguage();
  const t = useT();

  return (
    <div className="border-b border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {crumbs && crumbs.length > 0 && <AppBreadcrumb crumbs={crumbs} />}
        {back && (
          <Link
            href={back}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
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
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function PageContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full", className)}>
      {children}
    </div>
  );
}
