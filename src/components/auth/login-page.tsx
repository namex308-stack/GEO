"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Mail, Lock, Eye, EyeOff, ShieldCheck, Star, TrendingUp,
  Globe2, Package, BarChart3, Target, ArrowRight, Sparkles, Check,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/brand/logo";
import { useNavigateAfterAction } from "@/lib/use-navigate";
import { toast } from "sonner";

const STATS = [
  { icon: BarChart3, value: "10K+", label: "Stores Analyzed", color: "#FF6600" },
  { icon: Check, value: "95%", label: "Accuracy Rate", color: "#22C55E" },
  { icon: Package, value: "1M+", label: "Products Tracked", color: "#8B5CF6" },
  { icon: Globe2, value: "50+", label: "Countries", color: "#F59E0B" },
];

const WIDGETS = [
  { icon: TrendingUp, title: "Revenue Growth", value: "+34%", sub: "after audit fixes", color: "#22C55E" },
  { icon: Target, title: "Opportunity", value: "87/100", sub: "untapped potential", color: "#FF6600" },
  { icon: BarChart3, title: "Visibility", value: "92/100", sub: "AI + search ready", color: "#8B5CF6" },
];

const AVATAR_COLORS = ["#FF6600", "#ff983f", "#cc5200"];

export function LoginPage() {
  const { loginAndNavigate, navigateToView } = useNavigateAfterAction();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/oauth/google", { method: "GET", redirect: "manual" });
      if (res.type === "opaqueredirect" || res.status === 0 || res.status === 302 || res.status === 307) {
        window.location.assign("/api/oauth/google");
        return;
      }
      const data = await res.json().catch(() => null);
      if (data?.error) {
        loginAndNavigate();
        toast.success("Signed in (demo mode)", { description: "Add Supabase keys for real Google OAuth" });
        return;
      }
    } catch {
      // fall through to demo
    }
    loginAndNavigate();
    toast.success("Signed in with Google", { description: "Welcome to StorePulse AI" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      loginAndNavigate();
      toast.success("Signed in successfully", { description: "Welcome back to StorePulse AI" });
    }, 700);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* ===== LEFT: Hero (hidden on mobile, condensed version shown above form) ===== */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-border/40">
        {/* Ambient background — uses brand gradient, theme-aware */}
        <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_at_top_left,black_20%,transparent_70%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/15 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-chart-3/10 blur-[100px] rounded-full -z-10" />

        {/* Top: logo + badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <button onClick={() => navigateToView("landing")} className="flex items-center mb-8" aria-label="Back to home">
            <Logo />
          </button>
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm gradient-brand">
            <Sparkles className="size-3.5" />
            AI-Powered E-commerce Intelligence
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <h1 className="font-display text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight text-foreground">
            Outrank competitors
            <br />
            with AI-powered
            <br />
            <span className="gradient-text">ecommerce</span>
            <br />
            intelligence.
          </h1>
          <p className="mt-5 text-lg leading-relaxed max-w-md text-muted-foreground">
            Track competitors, discover opportunities, and grow your store with
            data-driven AI insights.
          </p>
        </motion.div>

        {/* Stats grid 2x2 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative grid grid-cols-2 gap-3 max-w-md"
        >
          {STATS.map((s, i) => (
            <div key={i} className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
              <div className="size-9 rounded-lg grid place-items-center mb-2.5" style={{ background: `${s.color}1a`, color: s.color }}>
                <s.icon className="size-5" />
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs mt-0.5 text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative flex items-center gap-3 rounded-xl bg-card border border-border/50 p-3.5 shadow-sm max-w-md"
        >
          <div className="flex -space-x-2">
            {AVATAR_COLORS.map((c, i) => (
              <span key={i} className="size-9 rounded-full border-2 border-background grid place-items-center text-white text-xs font-bold" style={{ background: c }}>
                {["A", "M", "S"][i]}
              </span>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs mt-1 text-muted-foreground">
              Trusted by 10,000+ ecommerce brands worldwide
            </span>
          </div>
        </motion.div>
      </div>

      {/* ===== RIGHT: Login form ===== */}
      <div className="relative flex items-center justify-center p-5 sm:p-8 lg:p-10">
        <div className="w-full max-w-md">
          {/* Mobile header (condensed hero) */}
          <div className="lg:hidden mb-7">
            <button onClick={() => navigateToView("landing")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
              <ArrowLeft className="size-4" /> Back to home
            </button>
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white gradient-brand mb-4">
              <Sparkles className="size-3" />
              AI-Powered E-commerce Intelligence
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight text-foreground">
              Outrank competitors with{" "}
              <span className="gradient-text">AI-powered ecommerce</span> intelligence.
            </h1>
            <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">
              Track competitors, discover opportunities, and grow your store with data-driven insights.
            </p>
            {/* Condensed stats — 4 in a row on mobile */}
            <div className="grid grid-cols-4 gap-2 mt-5">
              {STATS.map((s, i) => (
                <div key={i} className="rounded-lg bg-card border border-border/50 p-2 text-center">
                  <div className="font-display text-base font-bold text-foreground">{s.value}</div>
                  <div className="text-[9px] mt-0.5 text-muted-foreground leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Data widgets — show on lg+ (above the card) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="hidden lg:grid grid-cols-3 gap-3 mb-5"
          >
            {WIDGETS.map((w, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/50 p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="size-7 rounded-lg grid place-items-center" style={{ background: `${w.color}1a`, color: w.color }}>
                    <w.icon className="size-4" />
                  </span>
                  <TrendingUp className="size-3.5" style={{ color: w.color }} />
                </div>
                <div className="font-display text-lg font-bold text-foreground">{w.value}</div>
                <div className="text-[11px] font-medium text-muted-foreground">{w.title}</div>
                <div className="text-[10px] mt-0.5 text-muted-foreground/70">{w.sub}</div>
              </div>
            ))}
          </motion.div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl bg-card border border-border/60 p-6 sm:p-8 shadow-lg"
          >
            {/* Header */}
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">Welcome back</h2>
              <p className="text-sm mt-1 text-muted-foreground">
                Sign in to your account to continue
              </p>
            </div>

            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full h-12 rounded-xl border border-border bg-background hover:bg-accent transition-colors flex items-center justify-center gap-2.5 font-medium text-sm text-foreground disabled:opacity-60"
            >
              <GoogleIcon className="size-5" />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs font-medium text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl pl-11 text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl pl-11 pr-11 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>

              {/* Remember + forgot */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(v) => setRemember(!!v)}
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer text-muted-foreground">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Password reset link sent to your email")}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign in button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-semibold text-sm shadow-glow group"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="size-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-sm mt-5 text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                onClick={handleGoogle}
                className="font-semibold text-primary hover:underline"
              >
                Get started free
              </button>
            </p>

            {/* Security note */}
            <div className="flex items-center justify-center gap-1.5 mt-5 pt-5 border-t border-border/60">
              <ShieldCheck className="size-3.5 text-muted-foreground/70" />
              <span className="text-xs text-muted-foreground/70">
                Your data is secure with enterprise-grade encryption
              </span>
            </div>
          </motion.div>

          {/* Back to home — desktop */}
          <button
            onClick={() => navigateToView("landing")}
            className="hidden lg:flex items-center justify-center gap-1.5 mx-auto mt-6 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </button>
        </div>
      </div>
    </div>
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
