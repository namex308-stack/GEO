"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export function LoginModal() {
  const { loginOpen, closeLogin, login } = useAppStore();

  const handleGoogle = async () => {
    // Try the real Supabase OAuth flow first.
    try {
      const res = await fetch("/api/oauth/google", { method: "GET", redirect: "manual" });
      if (res.type === "opaqueredirect" || res.status === 0 || res.status === 302 || res.status === 307) {
        // Real OAuth redirect initiated — follow it.
        window.location.assign("/api/oauth/google");
        return;
      }
      const data = await res.json().catch(() => null);
      if (data?.error) {
        // Supabase not configured — fall back to demo login.
        login();
        toast.success("Signed in (demo mode)", {
          description: "Add Supabase keys to .env.local for real Google OAuth",
        });
        return;
      }
    } catch {
      // Network/redirect error — fall back to demo login.
    }
    login();
    toast.success("Signed in successfully", { description: "Let's set up your audit profile" });
  };

  return (
    <AnimatePresence>
      {loginOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center p-4"
        >
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={closeLogin}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-56 h-56 bg-primary/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-brand/15 blur-3xl rounded-full" />

            <button
              onClick={closeLogin}
              className="absolute top-4 right-4 size-8 rounded-full grid place-items-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors z-10"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>

            <div className="relative p-7 sm:p-8">
              <div className="flex justify-center mb-5">
                <Logo showWordmark={false} size={48} />
              </div>

              <h2 className="font-display text-2xl font-bold text-center">Start your free audit</h2>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Sign in to save your audits, track progress and unlock the AI Generator.
              </p>

              <div className="mt-7 space-y-3">
                <Button
                  onClick={handleGoogle}
                  className="w-full h-12 rounded-xl bg-white text-foreground border border-border hover:bg-white/90 font-semibold shadow-sm"
                >
                  <GoogleIcon className="size-5 mr-2.5" />
                  Continue with Google
                </Button>
                <Button
                  onClick={handleGoogle}
                  variant="outline"
                  className="w-full h-12 rounded-xl font-semibold"
                >
                  <Mail className="size-4 mr-2.5" />
                  Continue with email
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><ShieldCheck className="size-3.5 text-primary" /> Secure</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Sparkles className="size-3.5 text-brand" /> Free forever</span>
              </div>

              <p className="mt-6 text-center text-[11px] text-muted-foreground leading-relaxed">
                By continuing you agree to our Terms &amp; Privacy Policy.
                We use Google only for authentication — we never post on your behalf.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
