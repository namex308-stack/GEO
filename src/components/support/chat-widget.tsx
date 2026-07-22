"use client";

import * as React from "react";
import Link from "next/link";
import { Send, Loader2, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatIcon } from "@/components/support/chat-icon";
import { useT } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-store";
import { useMounted } from "@/hooks/use-mounted";
import { SUPPORT_FAQ, matchFaq } from "@/lib/support/faq-knowledge";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  link?: { href: string; label: string };
  pending?: boolean;
};

const QUICK_TOPICS = ["audit", "geo", "free", "payment", "ai", "contact"] as const;

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatWidget() {
  const t = useT();
  const { language, dir } = useLanguage();
  const mounted = useMounted();
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const greetedRef = React.useRef(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && !greetedRef.current) {
      greetedRef.current = true;
      setMessages([
        {
          id: uid(),
          role: "assistant",
          content: t("chat.greeting"),
        },
      ]);
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const resolveFaq = React.useCallback(
    (text: string) => {
      const entry = matchFaq(text, t);
      if (!entry) return null;
      return {
        content: t(entry.aKey),
        link: entry.link
          ? { href: entry.link.href, label: t(entry.link.labelKey) }
          : undefined,
      };
    },
    [t]
  );

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed };
    const pendingId = uid();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: pendingId, role: "assistant", content: "", pending: true },
    ]);
    setLoading(true);

    const local = resolveFaq(trimmed);
    if (local) {
      await new Promise((r) => setTimeout(r, 400));
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { id: pendingId, role: "assistant", content: local.content, link: local.link }
            : m
        )
      );
      setLoading(false);
      return;
    }

    try {
      const history = [...messages, userMsg]
        .filter((m) => !m.pending)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, language, history }),
      });

      const data = (await res.json()) as {
        reply: string;
        link?: { href: string; label: string };
      };

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                id: pendingId,
                role: "assistant",
                content: data.reply,
                link: data.link,
              }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                id: pendingId,
                role: "assistant",
                content: t("chat.error.fallback"),
                link: { href: "/contact", label: t("chat.link.contact") },
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  if (!mounted) return null;

  const sheetSide = dir === "rtl" ? "left" : "right";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => handleOpenChange(true)}
          className={cn(
            "fixed z-[60] bottom-6 flex items-center gap-3 rounded-full shadow-glow transition-all duration-300",
            "bg-gradient-to-r from-[#ff983f] to-[#cc5200] text-white",
            "hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]",
            "pl-2 pr-5 py-2 group",
            dir === "rtl" ? "left-6" : "right-6"
          )}
          aria-label={t("chat.open")}
        >
          <span className="relative flex size-12 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/30">
            <span className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-30" />
            <ChatIcon size={32} />
          </span>
          <span className={cn("hidden sm:flex flex-col leading-tight", dir === "rtl" ? "items-end text-right" : "items-start text-left")}>
            <span className="text-xs font-medium text-white/85">{t("chat.fab.eyebrow")}</span>
            <span className="text-sm font-bold">{t("chat.fab.label")}</span>
          </span>
        </button>
      )}

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side={sheetSide}
          className="w-full sm:max-w-[420px] p-0 gap-0 flex flex-col h-[100dvh] sm:h-full border-border/60"
        >
          <SheetHeader className="px-5 py-4 border-b border-border/60 bg-card/50 shrink-0">
            <div className="flex items-center gap-3 pr-8">
              <div className="relative">
                <span className="absolute -inset-1 rounded-2xl bg-primary/20 blur-sm" />
                <div className="relative size-11 rounded-2xl grid place-items-center bg-gradient-to-br from-[#ff983f] to-[#cc5200] shadow-glow">
                  <ChatIcon size={26} />
                </div>
              </div>
              <div className="min-w-0 text-left">
                <SheetTitle className="font-display text-base font-bold">
                  {t("chat.title")}
                </SheetTitle>
                <SheetDescription className="text-xs flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t("chat.subtitle")}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2.5",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="size-8 rounded-xl bg-gradient-to-br from-[#ff983f]/20 to-[#cc5200]/10 grid place-items-center shrink-0 mt-0.5">
                      <ChatIcon size={20} />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/60 border border-border/50 text-foreground rounded-bl-md"
                    )}
                  >
                    {msg.pending ? (
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />
                        {t("chat.typing")}
                      </span>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.link && (
                          <Link
                            href={msg.link.href}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            onClick={() => setOpen(false)}
                          >
                            {msg.link.label}
                            <ExternalLink className="size-3" />
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
              {QUICK_TOPICS.map((topicId) => {
                const entry = SUPPORT_FAQ.find((e) => e.id === topicId);
                if (!entry) return null;
                return (
                  <button
                    key={topicId}
                    type="button"
                    onClick={() => void sendMessage(t(entry.qKey))}
                    className="text-xs font-medium px-3 py-1.5 rounded-full border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    {t(entry.topicKey)}
                  </button>
                );
              })}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-border/60 bg-card/40 p-4 space-y-2"
          >
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.placeholder")}
                rows={1}
                className="min-h-[44px] max-h-28 resize-none rounded-xl text-sm"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={loading || !input.trim()}
                className="size-11 rounded-xl shrink-0 shadow-glow"
                aria-label={t("chat.send")}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              {t("chat.disclaimer")}{" "}
              <Link href="/contact" className="text-primary hover:underline" onClick={() => setOpen(false)}>
                {t("chat.link.contact")}
              </Link>
            </p>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
