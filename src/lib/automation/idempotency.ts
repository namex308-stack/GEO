import type { AutomationJobDefinition, AutomationJobId } from "./types";
import { getAutomationJobDefinition } from "./catalog";

export type IdempotencyRecord = {
  key: string;
  jobId: AutomationJobId;
  completedAt: string;
  status: "succeeded" | "failed" | "skipped_dry_run" | "not_implemented";
};

/**
 * Pluggable store — in-memory for tests / single-process workers.
 * Production may swap in Redis or Postgres later without changing callers.
 */
export interface IdempotencyStore {
  get(key: string): Promise<IdempotencyRecord | null>;
  set(record: IdempotencyRecord): Promise<void>;
}

export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly map = new Map<string, IdempotencyRecord>();

  async get(key: string): Promise<IdempotencyRecord | null> {
    return this.map.get(key) ?? null;
  }

  async set(record: IdempotencyRecord): Promise<void> {
    this.map.set(record.key, record);
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** UTC week key: YYYY-Www (ISO week). */
export function isoWeekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // Thursday in current week decides the year.
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${pad2(week)}`;
}

export function periodKeyForCadence(
  cadence: AutomationJobDefinition["cadence"],
  at: Date
): string {
  const y = at.getUTCFullYear();
  const m = pad2(at.getUTCMonth() + 1);
  const day = pad2(at.getUTCDate());
  const hour = pad2(at.getUTCHours());

  switch (cadence) {
    case "hourly":
      return `${y}-${m}-${day}T${hour}`;
    case "daily":
      return `${y}-${m}-${day}`;
    case "weekly":
      return isoWeekKey(at);
    case "monthly":
      return `${y}-${m}`;
    default: {
      const _exhaustive: never = cadence;
      return _exhaustive;
    }
  }
}

export function buildIdempotencyKey(
  jobId: AutomationJobId,
  at: Date = new Date(),
  definition: AutomationJobDefinition = getAutomationJobDefinition(jobId)
): string {
  const period = periodKeyForCadence(definition.cadence, at);
  return `automation:${jobId}:${period}`;
}

/**
 * Succeeded / dry-run / not_implemented completions block re-entry.
 * Failed runs do not — retries may reclaim the window.
 */
export function shouldSkipForIdempotency(
  existing: IdempotencyRecord | null
): boolean {
  if (!existing) return false;
  switch (existing.status) {
    case "succeeded":
    case "skipped_dry_run":
    case "not_implemented":
      return true;
    case "failed":
      return false;
    default: {
      const _exhaustive: never = existing.status;
      return _exhaustive;
    }
  }
}
