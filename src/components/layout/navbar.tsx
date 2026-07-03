"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Languages, Menu, Moon, Sun, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useLanguageStore } from "@/lib/language-store";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Features", target: "features" },
  { label: "How it works", target: "how" },
  { label: "Scores", target: "scores" },
  { label: "Pricing", target: "pricing" },
  { label: "FAQ", target: "faq" },
];

export function Navbar() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const isAuthed = useAppStore((s) => s.isAuthed);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const { startAuditAndNavigate, openLoginAndNavigate } = useNavigateAfterAction();
  const language = useLanguageStore((s) => s.language);
  const toggleLanguage = useLanguageStore((s) => s.toggleLanguage);
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Close mobile menu whenever the view changes (login, audit, dashboard, etc.)
  React.useEffect(() => {
    setMobileOpen(false);
  }, [view]);

  React.useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setView("landing");
    setMobileOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "glass border-b border-border/60 shadow-sm"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <button onClick={() => setView("landing")} className="flex items-center" aria-label="StorePulse AI home">
          <Logo />
        </button>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <button
              key={item.target}
              onClick={() => scrollTo(item.target)}
              className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
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
              aria-label="Toggle theme"
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          )}

          {isAuthed && user ? (
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setView("dashboard")}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-accent/60 transition-colors"
              >
                <span className="size-8 rounded-full gradient-brand text-white text-xs font-bold grid place-items-center">
                  {user.avatar}
                </span>
                <span className="text-sm font-medium max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
              </button>
              <Button size="sm" onClick={startAuditAndNavigate} className="rounded-full font-semibold">
                New Audit
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={openLoginAndNavigate}
                className="hidden sm:inline-flex rounded-full"
              >
                Log in
              </Button>
              {/* Hide "Start Free Audit" on landing — the hero already has it */}
              {view !== "landing" && (
                <Button size="sm" onClick={startAuditAndNavigate} className="rounded-full font-semibold shadow-glow">
                  Start Free Audit
                </Button>
              )}
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-full"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`lg:hidden glass border-b border-border/60 overflow-hidden transition-all duration-300 ${mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"}`}
      >
        <div className="px-4 py-4 space-y-1">
            {NAV.map((item) => (
              <button
                key={item.target}
                onClick={() => scrollTo(item.target)}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
              <Button variant="ghost" onClick={() => { setMobileOpen(false); toggleLanguage(); }} className="rounded-full w-full gap-1.5 font-semibold">
                <Languages className="size-4" />
                {language === "en" ? "العربية" : "English"}
              </Button>
              {!isAuthed && (
                <Button variant="outline" onClick={() => { setMobileOpen(false); openLoginAndNavigate(); }} className="rounded-full w-full">
                  Log in
                </Button>
              )}
              <Button onClick={() => { setMobileOpen(false); startAuditAndNavigate(); }} className="rounded-full w-full">
                Start Free Audit
              </Button>
              {isAuthed && (
                <Button variant="ghost" onClick={() => { setMobileOpen(false); logout(); }} className="rounded-full w-full">
                  Log out
                </Button>
              )}
            </div>
        </div>
      </div>
    </header>
  );
}
