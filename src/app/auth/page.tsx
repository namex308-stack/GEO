"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Sparkles } from "lucide-react";
import { PageShell } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/brand/logo";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { useT, type TranslationKey } from "@/lib/i18n";

type StatItem = { v: string; lKey: TranslationKey };

const STATS: StatItem[] = [
  { v: "10K+", lKey: "auth.stat.stores" },
  { v: "95%", lKey: "auth.stat.accuracy" },
  { v: "1M+", lKey: "auth.stat.products" },
  { v: "50+", lKey: "auth.stat.countries" },
];

export default function AuthPage() {
  const t = useT();
  const { loginAndNavigate } = useNavigateAfterAction();
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => loginAndNavigate(), 800);
  };

  const isLogin = mode === "login";

  return (
    <PageShell>
      <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
        {/* ===== LEFT: Hero (desktop only — full height marketing panel) ===== */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 overflow-hidden">
          {/* Ambient background */}
          <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/15 blur-[120px] rounded-full -z-10" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand/10 blur-[100px] rounded-full -z-10" />

          {/* Top: logo */}
          <Link href="/" className="relative">
            <Logo />
          </Link>

          {/* Middle: headline */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white gradient-brand mb-4">
              <Sparkles className="size-3.5" /> {t("auth.badge")}
            </div>
            <h1 className="font-display text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight">
              {t("auth.headlineLead")}<br />{t("auth.headlineMid")}<span className="gradient-text">{t("auth.headlineAccent")}</span><br />{t("auth.headlineTail")}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-md">
              {t("auth.subheadline")}
            </p>
          </div>

          {/* Bottom: stats */}
          <div className="relative grid grid-cols-4 gap-3 max-w-md">
            {STATS.map((s) => (
              <div key={s.lKey} className="rounded-xl bg-card border border-border/50 p-3 text-center">
                <div className="font-display text-xl font-bold">{s.v}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t(s.lKey)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== RIGHT: Login form (visible on all screen sizes) ===== */}
        <div className="relative flex items-center justify-center p-4 sm:p-8 lg:p-10 overflow-y-auto">
          {/* Ambient glow for mobile */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/8 blur-[100px] rounded-full -z-10 lg:hidden" />

          <div className="w-full max-w-md py-6 lg:py-0">
            {/* Mobile-only condensed hero (above the form) */}
            <div className="lg:hidden mb-6">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="size-4" /> {t("auth.backToHome")}
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white gradient-brand mb-3">
                <Sparkles className="size-3" /> {t("auth.badge")}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
                {t("auth.headlineLead")}{" "}
                <span className="gradient-text">{t("auth.headlineAccent")}</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {t("auth.subheadline")}
              </p>
              {/* Condensed stats — 4 in a row on mobile */}
              <div className="grid grid-cols-4 gap-2 mt-4">
                {STATS.map((s) => (
                  <div key={s.lKey} className="rounded-lg bg-card border border-border/50 p-2 text-center">
                    <div className="font-display text-sm font-bold">{s.v}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{t(s.lKey)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Login card */}
            <div className="rounded-2xl bg-card border border-border/60 p-5 sm:p-8 shadow-lg">
              {/* Header */}
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold">{isLogin ? t("auth.welcomeBack") : t("auth.createAccount")}</h2>
                <p className="text-sm mt-1 text-muted-foreground">{isLogin ? t("auth.signInToContinue") : t("auth.startFreeToday")}</p>
              </div>

              {/* Google button */}
              <button
                onClick={loginAndNavigate}
                className="w-full h-12 rounded-xl border border-border bg-background hover:bg-accent transition-colors flex items-center justify-center gap-2.5 font-medium text-sm"
              >
                <GoogleIcon className="size-5" /> {t("auth.continueWithGoogle")}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-medium text-muted-foreground">{t("auth.or")}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-muted-foreground">{t("auth.fullName")}</Label>
                    <Input placeholder={t("auth.enterName")} className="h-12 rounded-xl text-sm" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60" />
                    <Input
                      type="email"
                      placeholder={t("auth.enterEmail")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 rounded-xl pl-11 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.enterPassword")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl pl-11 pr-11 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      aria-label={t("auth.showPassword")}
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
                {isLogin && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                      <Label htmlFor="remember" className="text-sm cursor-pointer text-muted-foreground">{t("auth.rememberMe")}</Label>
                    </div>
                    <button type="button" className="text-sm font-medium text-primary hover:underline">{t("auth.forgotPassword")}</button>
                  </div>
                )}
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-semibold text-sm shadow-glow">
                  {loading ? t("auth.signingIn") : isLogin ? t("auth.signIn") : t("auth.createAccount")}
                </Button>
              </form>

              {/* Sign up / login link */}
              <p className="text-center text-sm mt-5 text-muted-foreground">
                {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
                <button onClick={() => setMode(isLogin ? "signup" : "login")} className="font-semibold text-primary hover:underline">
                  {isLogin ? t("auth.signUp") : t("auth.signInLink")}
                </button>
              </p>

              {/* Security note */}
              <div className="flex items-center justify-center gap-1.5 mt-5 pt-5 border-t border-border/60">
                <ShieldCheck className="size-3.5 text-muted-foreground/70" />
                <span className="text-xs text-muted-foreground/70">{t("auth.securityNote")}</span>
              </div>
            </div>

            {/* Back to home — desktop */}
            <button
              onClick={() => window.history.back()}
              className="hidden lg:flex items-center justify-center gap-1.5 mx-auto mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" /> {t("auth.backToHome")}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
