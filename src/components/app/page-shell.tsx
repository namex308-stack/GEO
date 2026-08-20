"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useLocale } from "@/lib/locale/resolve";
import { isAppShellRoute } from "@/lib/app-nav";
import { decodeHtmlEntities } from "@/lib/text/decode-html";
import {
  PROFILE_UPDATED_EVENT,
  type ProfileUpdatedDetail,
} from "@/lib/auth/display-user";

/** Public routes share homepage Navbar + Footer (one marketing chrome). */
function MarketingShell({ children }: { children: React.ReactNode }) {
  const { lang, dir } = useLocale();

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={dir} lang={lang}>
      <Navbar />
      <main className="flex-1 flex flex-col pt-16">{children}</main>
      <Footer />
    </div>
  );
}

function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lang, dir } = useLocale();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [latestAuditId, setLatestAuditId] = React.useState<string | null>(null);
  const [planName, setPlanName] = React.useState<string | null>(null);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [preferredDisplayName, setPreferredDisplayName] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const loadShell = React.useCallback(async (signal?: { cancelled: boolean }) => {
    try {
      const res = await fetch("/api/shell");
      if (!res.ok) return;
      const json = (await res.json()) as {
        shell?: {
          planName?: string;
          displayName?: string | null;
          latestAuditId?: string | null;
          notificationCount?: number;
        };
      };
      if (signal?.cancelled || !json.shell) return;
      setPlanName(json.shell.planName ?? null);
      setPreferredDisplayName(json.shell.displayName ?? null);
      const latest = json.shell.latestAuditId ?? null;
      setLatestAuditId(latest);
      setNotificationCount(latest ? (json.shell.notificationCount ?? 0) : 0);
    } catch {
      /* ignore — nav still works with fallbacks */
    }
  }, []);

  React.useEffect(() => {
    const state = { cancelled: false };
    void loadShell(state);
    return () => {
      state.cancelled = true;
    };
  }, [pathname, loadShell]);

  React.useEffect(() => {
    const onProfileUpdated = (event: Event) => {
      const detail = (event as CustomEvent<ProfileUpdatedDetail>).detail;
      if (detail?.displayName) setPreferredDisplayName(detail.displayName);
      void loadShell();
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, onProfileUpdated);
  }, [loadShell]);

  const compactGreeting = pathname !== "/dashboard";

  return (
    <div className="min-h-screen bg-background" dir={dir} lang={lang}>
      <AppSidebar
        latestAuditId={latestAuditId}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        preferredDisplayName={preferredDisplayName}
        planName={planName}
      />
      <div className="min-h-screen flex flex-col lg:ms-[260px]">
        <AppTopbar
          planName={planName}
          notificationCount={notificationCount}
          latestAuditId={latestAuditId}
          preferredDisplayName={preferredDisplayName}
          onMenuOpen={() => setMobileOpen(true)}
          compactGreeting={compactGreeting}
        />
        <main className="flex-1 flex flex-col min-w-0 w-full">{children}</main>
      </div>
    </div>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isAppShellRoute(pathname)) {
    return <ProductShell>{children}</ProductShell>;
  }
  return <MarketingShell>{children}</MarketingShell>;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  back,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  back?: string;
}) {
  const pathname = usePathname();
  const inApp = isAppShellRoute(pathname);
  const { dir } = useLocale();
  const t = useT();
  const displayTitle = decodeHtmlEntities(title);
  const displaySubtitle = subtitle ? decodeHtmlEntities(subtitle) : subtitle;

  if (inApp) {
    return (
      <div className="border-b border-border/50 bg-card/50">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
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
                <span className="size-11 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow shrink-0">
                  <Icon className="size-5" />
                </span>
              )}
              <div>
                <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight">
                  {displayTitle}
                </h1>
                {displaySubtitle && <p className="text-sm text-muted-foreground mt-1">{displaySubtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border/50 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {back && (
          <Link
            href={back}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ChevronLeft className={cn("size-4", dir === "rtl" && "rotate-180")} />
            {t("footer.back")}
          </Link>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            {Icon && (
              <span className="size-12 rounded-2xl gradient-brand grid place-items-center text-white shadow-glow shrink-0">
                <Icon className="size-6" />
              </span>
            )}
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
                {displayTitle}
              </h1>
              {displaySubtitle && (
                <p className="text-sm sm:text-base text-muted-foreground mt-1.5">{displaySubtitle}</p>
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
  const pathname = usePathname();
  const inApp = isAppShellRoute(pathname);

  return (
    <div
      className={cn(
        inApp
          ? "px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full"
          : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Minimal chrome for focused flows (checkout, etc.). */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const { lang, dir } = useLocale();
  return (
    <div className="min-h-screen bg-background" dir={dir} lang={lang}>
      {children}
    </div>
  );
}
