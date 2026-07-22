"use client";

import type { AuditData } from "./types";

const STORAGE_PREFIX = "convaudit:audit:";

export function saveAudit(id: string, audit: AuditData): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(audit));
  } catch {
    // sessionStorage full or unavailable
  }
}

export function getAudit(id: string): AuditData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${id}`);
    return raw ? (JSON.parse(raw) as AuditData) : null;
  } catch {
    return null;
  }
}

export function generateAuditId(): string {
  return crypto.randomUUID();
}
