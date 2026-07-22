import "server-only";
import type { PageSnapshot } from "./types";

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function validateSnapshot(snapshot: PageSnapshot): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const markdownLen = (snapshot.markdown ?? "").trim().length;
  const htmlLen = (snapshot.html ?? "").trim().length;

  if (!snapshot.url) {
    errors.push({ code: "missing_url", message: "Snapshot is missing a URL." });
  }

  if (markdownLen < 200) {
    errors.push({ code: "insufficient_content", message: "Page content is too short to score reliably." });
  } else if (markdownLen < 800) {
    warnings.push({ code: "low_content", message: "Page content is short; scores may be noisy." });
  }

  if (htmlLen < 200) {
    warnings.push({ code: "missing_html", message: "HTML is missing or truncated; some engines may degrade." });
  }

  if (!snapshot.title || snapshot.title.trim().length < 5) {
    warnings.push({ code: "missing_title", message: "Page title is missing or too short." });
  }

  return { ok: errors.length === 0, errors, warnings };
}

