import type { PageType } from "@/lib/db/types";

export function classifyPageType(url: string, title: string, markdown: string): PageType {
  const path = safePath(url).toLowerCase();
  const blob = `${path} ${title} ${markdown.slice(0, 1500)}`.toLowerCase();

  if (/\/products?\//.test(path) || /product|sku|add to cart|buy now/.test(blob)) return "product";
  if (/\/collections?\//.test(path) || /\/categor(y|ies)\//.test(path)) return "collection";
  if (/faq|frequently asked/.test(blob)) return "faq";
  if (/contact|support@|get in touch/.test(blob)) return "contact";
  if (/privacy|refund|shipping|terms|policy|return/.test(blob)) return "policy";
  if (/\/blog\//.test(path) || /\/articles?\//.test(path)) return "blog";
  if (path === "/" || path === "" || /home/.test(title.toLowerCase())) return "homepage";
  return "unknown";
}

function safePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}
