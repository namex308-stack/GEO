import type { TranslationKey } from "@/lib/i18n";

export type FaqEntry = {
  id: string;
  topicKey: TranslationKey;
  qKey: TranslationKey;
  aKey: TranslationKey;
  keywords: string[];
  link?: { href: string; labelKey: TranslationKey };
};

/** Bilingual keyword hints + i18n keys for instant FAQ matching. */
export const SUPPORT_FAQ: FaqEntry[] = [
  {
    id: "audit",
    topicKey: "chat.topic.audit",
    qKey: "faq.q1",
    aKey: "faq.a1",
    keywords: ["audit", "analyze", "analysis", "how", "work", "firecrawl", "score", "report", "تحليل", "كيف", "يعمل"],
    link: { href: "/how-it-works", labelKey: "chat.link.howItWorks" },
  },
  {
    id: "geo",
    topicKey: "chat.topic.geo",
    qKey: "faq.q2",
    aKey: "faq.a2",
    keywords: ["geo", "visibility", "chatgpt", "perplexity", "ai search", "generative", "ظهور", "جيو"],
    link: { href: "/geo-visibility", labelKey: "chat.link.geo" },
  },
  {
    id: "platforms",
    topicKey: "chat.topic.platforms",
    qKey: "faq.q3",
    aKey: "faq.a3",
    keywords: ["shopify", "woocommerce", "salla", "zid", "platform", "store", "منصة", "سلة", "زد"],
  },
  {
    id: "payment",
    topicKey: "chat.topic.payment",
    qKey: "faq.q4",
    aKey: "faq.a4",
    keywords: ["payment", "pay", "kashier", "card", "vodafone", "instapay", "egp", "دفع", "كاشير", "بطاقة"],
    link: { href: "/pricing", labelKey: "chat.link.pricing" },
  },
  {
    id: "free",
    topicKey: "chat.topic.free",
    qKey: "faq.q5",
    aKey: "faq.a5",
    keywords: ["free", "trial", "limit", "monthly", "plan", "مجاني", "مجانية", "حد"],
    link: { href: "/pricing", labelKey: "chat.link.pricing" },
  },
  {
    id: "ai",
    topicKey: "chat.topic.ai",
    qKey: "faq.q6",
    aKey: "faq.a6",
    keywords: ["generator", "generate", "copy", "write", "content", "ai", "gemini", "مولد", "محتوى", "كتابة"],
    link: { href: "/ai-generator", labelKey: "chat.link.aiGenerator" },
  },
  {
    id: "privacy",
    topicKey: "chat.topic.privacy",
    qKey: "faq.q7",
    aKey: "faq.a7",
    keywords: ["private", "privacy", "data", "secure", "competitor", "خصوصية", "بيانات", "أمان"],
    link: { href: "/privacy", labelKey: "chat.link.privacy" },
  },
  {
    id: "pro",
    topicKey: "chat.topic.pro",
    qKey: "pricingFaq.q2",
    aKey: "pricingFaq.a2",
    keywords: ["pro", "business", "upgrade", "difference", "compare", "احترافي", "أعمال", "ترقية"],
    link: { href: "/pricing", labelKey: "chat.link.pricing" },
  },
  {
    id: "cancel",
    topicKey: "chat.topic.cancel",
    qKey: "pricingFaq.q6",
    aKey: "pricingFaq.a6",
    keywords: ["cancel", "subscription", "unsubscribe", "إلغاء", "اشتراك"],
    link: { href: "/settings/billing", labelKey: "chat.link.billing" },
  },
  {
    id: "refund",
    topicKey: "chat.topic.refund",
    qKey: "chat.faq.refund.q",
    aKey: "chat.faq.refund.a",
    keywords: ["refund", "money back", "return", "استرداد", "استرجاع"],
    link: { href: "/legal/refund-policy", labelKey: "chat.link.refund" },
  },
  {
    id: "contact",
    topicKey: "chat.topic.contact",
    qKey: "chat.faq.contact.q",
    aKey: "chat.faq.contact.a",
    keywords: ["contact", "support", "email", "help", "human", "تواصل", "دعم", "بريد", "مساعدة"],
    link: { href: "/contact", labelKey: "chat.link.contact" },
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchFaq(
  query: string,
  getText: (key: TranslationKey) => string,
  minScore = 2
): FaqEntry | null {
  const normalized = normalize(query);
  if (!normalized) return null;

  const words = normalized.split(" ").filter((w) => w.length > 1);

  let best: { entry: FaqEntry; score: number } | null = null;

  for (const entry of SUPPORT_FAQ) {
    let score = 0;
    const question = normalize(getText(entry.qKey));

    for (const kw of entry.keywords) {
      const nkw = normalize(kw);
      if (normalized.includes(nkw)) score += 4;
    }

    for (const word of words) {
      if (question.includes(word)) score += 2;
      for (const kw of entry.keywords) {
        if (normalize(kw).includes(word) || word.includes(normalize(kw))) score += 1;
      }
    }

    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  return best && best.score >= minScore ? best.entry : null;
}

export function buildSupportContext(getText: (key: TranslationKey) => string): string {
  return SUPPORT_FAQ.map(
    (entry) => `Q: ${getText(entry.qKey)}\nA: ${getText(entry.aKey)}`
  ).join("\n\n");
}
