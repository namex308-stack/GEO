"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/app/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/brand/logo";
import { useT, type TranslationKey } from "@/lib/i18n";
import { toast } from "sonner";
import { getSupabaseBrowser, setAuthRedirectCookie } from "@/lib/supabase-browser";
import {
  isGuidedFlowComplete,
  resumePathForFlow,
} from "@/lib/workflow/flow-state";

/**
 * Where to land after a successful sign-in: resume the guided flow
 * (quiz → connect → first audit → report) if it isn't finished yet,
 * otherwise honor the requested redirect.
 */
async function resolvePostLoginPath(fallback: string): Promise<string> {
  try {
    const res = await fetch("/api/onboarding");
    if (!res.ok) return fallback;
    const data = await res.json();
    const onboarding =
      (data.onboarding as Record<string, string> | null) ?? {};
    if (!isGuidedFlowComplete(onboarding)) {
      return resumePathForFlow(onboarding);
    }
  } catch {
    /* fall through to requested redirect */
  }
  return fallback;
}

type StatItem = { v: string; lKey: TranslationKey };

const STATS: StatItem[] = [
  { v: "10K+", lKey: "auth.stat.stores" },
  { v: "95%", lKey: "auth.stat.accuracy" },
  { v: "1M+", lKey: "auth.stat.products" },
  { v: "50+", lKey: "auth.stat.countries" },
];

export default function AuthPage() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  // Read query params from window instead of useSearchParams() so this page
  // renders immediately on the server instead of suspending into the root
  // loading fallback ("Loading convaudit…") until client JS hydrates.
  const [redirectTo] = React.useState(() => {
    if (typeof window === "undefined") return "/dashboard";
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect") || "/dashboard";
  });

  const [mode, setMode] = React.useState<"login" | "signup">(
    pathname === "/signup" ? "signup" : "login"
  );
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const err = params.get("error");
    if (err === "server_error") {
      toast.error("Sign-in failed: account setup error. Run: npm run db:fix-auth — then paste the SQL in Supabase SQL Editor.");
    } else if (err) {
      toast.error(`Sign-in failed (${err}). Please try again.`);
    }
  }, []);

  const handleGoogleLogin = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      toast.error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
      return;
    }

    setAuthRedirectCookie(redirectTo);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please enter email and password"); return; }

    setLoading(true);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      toast.error("Supabase is not configured");
      setLoading(false);
      return;
    }

    try {
      if (mode === "signup") {
        setAuthRedirectCookie(redirectTo);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const destination = await resolvePostLoginPath(redirectTo);
        router.push(destination);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <AuthShell>
      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/15 blur-[120px] rounded-full -z-10" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-brand/10 blur-[100px] rounded-full -z-10" />

          <Link href="/" className="relative"><Logo /></Link>

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white gradient-brand mb-4">
              <Sparkles className="size-3.5" /> {t("auth.badge")}
            </div>
            <h1 className="font-display text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight">
              {t("auth.headlineLead")}<br />{t("auth.headlineMid")}<span className="gradient-text">{t("auth.headlineAccent")}</span><br />{t("auth.headlineTail")}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-md">{t("auth.subheadline")}</p>
          </div>

          <div className="relative grid grid-cols-4 gap-3 max-w-md">
            {STATS.map((s) => (
              <div key={s.lKey} className="rounded-xl bg-card border border-border/50 p-3 text-center">
                <div className="font-display text-xl font-bold">{s.v}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t(s.lKey)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center p-4 sm:p-8 lg:p-10 overflow-y-auto">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/8 blur-[100px] rounded-full -z-10 lg:hidden" />
          <div className="w-full max-w-md py-6 lg:py-0">
            <div className="lg:hidden mb-6">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="size-4" /> {t("auth.backToHome")}
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white gradient-brand mb-3">
                <Sparkles className="size-3" /> {t("auth.badge")}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
                {t("auth.headlineLead")} <span className="gradient-text">{t("auth.headlineAccent")}</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t("auth.subheadline")}</p>
              <div className="grid grid-cols-4 gap-2 mt-4">
                {STATS.map((s) => (
                  <div key={s.lKey} className="rounded-lg bg-card border border-border/50 p-2 text-center">
                    <div className="font-display text-sm font-bold">{s.v}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{t(s.lKey)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border/60 p-5 sm:p-8 shadow-lg">
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold">{isLogin ? t("auth.welcomeBack") : t("auth.createAccount")}</h2>
                <p className="text-sm mt-1 text-muted-foreground">{isLogin ? t("auth.signInToContinue") : t("auth.startFreeToday")}</p>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full h-12 rounded-xl border border-border bg-background hover:bg-accent transition-colors flex items-center justify-center gap-2.5 font-medium text-sm"
              >
                <GoogleIcon className="size-5" /> {t("auth.continueWithGoogle")}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-medium text-muted-foreground">{t("auth.or")}</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60" />
                    <Input type="email" placeholder={t("auth.enterEmail")} value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl pl-11 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60" />
                    <Input type={showPassword ? "text" : "password"} placeholder={t("auth.enterPassword")} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl pl-11 pr-11 text-sm" />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors" aria-label={t("auth.showPassword")}>
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
                  {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  {loading ? t("auth.signingIn") : isLogin ? t("auth.signIn") : t("auth.createAccount")}
                </Button>
              </form>

              <p className="text-center text-sm mt-5 text-muted-foreground">
                {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
                <button onClick={() => setMode(isLogin ? "signup" : "login")} className="font-semibold text-primary hover:underline">
                  {isLogin ? t("auth.signUp") : t("auth.signInLink")}
                </button>
              </p>

              <div className="flex items-center justify-center gap-1.5 mt-5 pt-5 border-t border-border/60">
                <ShieldCheck className="size-3.5 text-muted-foreground/70" />
                <span className="text-xs text-muted-foreground/70">{t("auth.securityNote")}</span>
              </div>
            </div>

            <button onClick={() => window.history.back()} className="hidden lg:flex items-center justify-center gap-1.5 mx-auto mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="size-3.5" /> {t("auth.backToHome")}
            </button>
          </div>
        </div>
      </div>
    </AuthShell>
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
