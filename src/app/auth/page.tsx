"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import { AuthShell } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/brand/logo";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase-browser";
import { mapAuthErrorMessage } from "@/lib/auth/map-auth-error";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { withTimeout } from "@/lib/with-timeout";
import { translate, useT, type TranslationKey } from "@/lib/i18n";

type StatItem = { v: string; lKey: TranslationKey };

const STATS: StatItem[] = [
  { v: "4", lKey: "metrics.pillars.title" },
  { v: "40+", lKey: "metrics.signals.title" },
  { v: "3", lKey: "metrics.engines.title" },
  { v: "1", lKey: "metrics.languages.title" },
];

const CALLBACK_ERROR_KEYS: Record<string, TranslationKey> = {
  no_code: "auth.error.noCode",
  supabase_not_configured: "auth.error.notConfigured",
  auth_callback_failed: "auth.error.callbackFailed",
};

const AUTH_REQUEST_MS = 12_000;

export default function AuthPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen grid place-items-center px-4" aria-busy="true">
          <p className="text-sm text-muted-foreground">{translate("common.loading")}</p>
        </div>
      }
    >
      <AuthPageInner />
    </React.Suspense>
  );
}

function AuthPageInner() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const initialMode =
    searchParams.get("mode") === "signup" || searchParams.get("signup") === "1"
      ? "signup"
      : "login";
  const [mode, setMode] = React.useState<"login" | "signup">(initialMode);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const nextPath = safeNextPath(
    searchParams.get("next") ?? searchParams.get("redirect")
  );
  const callbackError = searchParams.get("error");

  React.useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup" || searchParams.get("signup") === "1") setMode("signup");
    if (m === "login") setMode("login");
  }, [searchParams]);

  React.useEffect(() => {
    if (!callbackError) return;
    const key = CALLBACK_ERROR_KEYS[callbackError];
    setError(key ? t(key) : t("auth.error.generic"));
  }, [callbackError, t]);

  const redirectAfterAuth = React.useCallback(() => {
    router.replace(nextPath);
    router.refresh();
  }, [nextPath, router]);

  const handleGoogle = async () => {
    setError(null);
    setInfo(null);
    if (!isSupabaseConfigured()) {
      setError(t("auth.error.notConfigured"));
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError(t("auth.error.notConfigured"));
      return;
    }

    setLoading(true);
    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (oauthError) {
      setLoading(false);
      setError(mapAuthErrorMessage(oauthError, t));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!isSupabaseConfigured()) {
      setError(t("auth.error.notConfigured"));
      return;
    }
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError(t("auth.error.notConfigured"));
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(t("auth.error.missingFields"));
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const signInResult = await withTimeout(
          supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          }),
          AUTH_REQUEST_MS,
          null
        );
        if (!signInResult) {
          setError(t("auth.error.generic"));
          return;
        }
        if (signInResult.error) {
          setError(mapAuthErrorMessage(signInResult.error, t));
          return;
        }
        redirectAfterAuth();
        return;
      }

      if (!fullName.trim()) {
        setError(t("auth.error.missingFields"));
        return;
      }

      const signUpResult = await withTimeout(
        supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        }),
        AUTH_REQUEST_MS,
        null
      );
      if (!signUpResult) {
        setError(t("auth.error.generic"));
        return;
      }
      if (signUpResult.error) {
        setError(mapAuthErrorMessage(signUpResult.error, t));
        return;
      }
      if (signUpResult.data.session) {
        redirectAfterAuth();
        return;
      }
      setInfo(t("auth.checkEmail"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(mapAuthErrorMessage(message, t));
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <AuthShell>
      <div className="min-h-screen flex flex-col">
        <header className="shrink-0 h-16 border-b border-border/60 bg-background/90 backdrop-blur-sm">
          <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <Link
              href="/"
              className="rounded-md focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("navbar.homeAriaLabel")}
            >
              <Logo />
            </Link>
            <div className="flex items-center gap-1.5">
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
            </div>
          </div>
        </header>

        <div className="flex-1 grid lg:grid-cols-2 lg:items-start min-h-0">
          <aside className="relative hidden lg:flex flex-col justify-start gap-12 p-10 xl:p-14 overflow-hidden border-e border-border/50">
            <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" />
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/15 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

            <div className="relative space-y-5 max-w-lg">
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white gradient-brand">
                <Sparkles className="size-3.5" aria-hidden />
                {t("auth.badge")}
              </div>
              <h1 className="font-display text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight">
                {t("auth.headlineLead")}
                <br />
                {t("auth.headlineMid")}
                <span className="gradient-text">{t("auth.headlineAccent")}</span>
                <br />
                {t("auth.headlineTail")}
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                {t("auth.subheadline")}
              </p>
            </div>

            <div className="relative grid grid-cols-4 gap-3 max-w-md">
              {STATS.map((s) => (
                <div
                  key={s.lKey}
                  className="rounded-xl bg-card border border-border/50 p-3 text-center"
                >
                  <div className="font-display text-xl font-bold tabular-nums">{s.v}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {t(s.lKey)}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="relative flex items-start justify-center p-4 sm:p-8 lg:p-10 xl:p-14">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/8 blur-[100px] rounded-full -z-10 pointer-events-none lg:hidden" />

            <div className="w-full max-w-md">
              <div className="lg:hidden mb-6">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                  <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
                  {t("auth.backToHome")}
                </Link>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white gradient-brand mb-3">
                  <Sparkles className="size-3" aria-hidden />
                  {t("auth.badge")}
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
                  {t("auth.headlineLead")}{" "}
                  <span className="gradient-text">{t("auth.headlineAccent")}</span>
                </h1>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {t("auth.subheadline")}
                </p>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {STATS.map((s) => (
                    <div
                      key={s.lKey}
                      className="rounded-lg bg-card border border-border/50 p-2 text-center"
                    >
                      <div className="font-display text-sm font-bold tabular-nums">{s.v}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {t(s.lKey)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-card border border-border/60 p-5 sm:p-8 shadow-[var(--shadow-card)]">
                <div className="mb-6">
                  <h2 className="font-display text-2xl font-bold">
                    {isLogin ? t("auth.welcomeBack") : t("auth.createAccount")}
                  </h2>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {isLogin ? t("auth.signInToContinue") : t("auth.startFreeToday")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleGoogle()}
                  disabled={loading}
                  className="w-full h-12 rounded-xl border border-border bg-background hover:bg-accent transition-colors flex items-center justify-center gap-2.5 font-medium text-sm disabled:opacity-60"
                >
                  <GoogleIcon className="size-5" />
                  {t("auth.continueWithGoogle")}
                </button>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-medium text-muted-foreground">{t("auth.or")}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <form
                  method="dialog"
                  noValidate
                  data-hydrated={mounted ? "true" : "false"}
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmit(e);
                  }}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t("auth.fullName")}
                      </Label>
                      <Input
                        placeholder={t("auth.enterName")}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                        className="h-12 rounded-xl text-sm"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t("auth.email")}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60 pointer-events-none" />
                      <Input
                        type="email"
                        placeholder={t("auth.enterEmail")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        className="h-12 rounded-xl ps-11 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {t("auth.password")}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60 pointer-events-none" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.enterPassword")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        required
                        minLength={6}
                        className="h-12 rounded-xl ps-11 pe-11 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                        aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                      >
                        {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                  </div>
                  {isLogin && (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remember"
                          checked={remember}
                          onCheckedChange={(v) => setRemember(!!v)}
                        />
                        <Label
                          htmlFor="remember"
                          className="text-sm cursor-pointer text-muted-foreground"
                        >
                          {t("auth.rememberMe")}
                        </Label>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-medium text-primary hover:underline"
                        onClick={() => {
                          setInfo(t("auth.forgotPasswordHint"));
                        }}
                      >
                        {t("auth.forgotPassword")}
                      </button>
                    </div>
                  )}

                  {(error || info) && (
                    <div
                      role="alert"
                      className={
                        error
                          ? "rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                          : "rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
                      }
                    >
                      {error ?? info}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl font-semibold text-sm shadow-glow"
                  >
                    {loading
                      ? t("auth.signingIn")
                      : isLogin
                        ? t("auth.signIn")
                        : t("auth.createAccount")}
                  </Button>
                </form>

                <p className="text-center text-sm mt-5 text-muted-foreground">
                  {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode(isLogin ? "signup" : "login");
                      setError(null);
                      setInfo(null);
                    }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {isLogin ? t("auth.signUp") : t("auth.signInLink")}
                  </button>
                </p>

                <div className="flex items-center justify-center gap-1.5 mt-5 pt-5 border-t border-border/60">
                  <ShieldCheck className="size-3.5 text-muted-foreground/70" aria-hidden />
                  <span className="text-xs text-muted-foreground/70">{t("auth.securityNote")}</span>
                </div>
              </div>

              <Link
                href="/"
                className="hidden lg:flex items-center justify-center gap-1.5 mx-auto mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
                {t("auth.backToHome")}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </AuthShell>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
