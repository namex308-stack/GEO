"use client";

import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () => import("@/components/support/chat-widget").then((m) => ({ default: m.ChatWidget })),
  { ssr: false },
);

/** Lazily loads the support chat after hydration to keep marketing pages lighter. */
export function LazyChatWidget() {
  return <ChatWidget />;
}
