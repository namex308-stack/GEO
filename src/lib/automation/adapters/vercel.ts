import { listAutomationJobDefinitions } from "../catalog";
import type { AutomationAdapterKind, VercelCronEntry } from "../types";

/**
 * Build Vercel Cron entries from the catalog.
 *
 * By default only `productionActivated` jobs are returned (currently none),
 * so calling this never activates schedules. Pass `{ includeInactive: true }`
 * for dry inspection / future activation planning.
 */
export function buildVercelCronEntries(options?: {
  includeInactive?: boolean;
  adapter?: AutomationAdapterKind;
}): VercelCronEntry[] {
  const adapter = options?.adapter ?? "vercel";
  const includeInactive = options?.includeInactive === true;

  return listAutomationJobDefinitions()
    .filter((job) => job.adapters.includes(adapter))
    .filter((job) => includeInactive || job.productionActivated)
    .map((job) => ({
      path: job.httpPath,
      schedule: job.schedule,
      jobId: job.id,
    }));
}

/**
 * Shape compatible with vercel.json `crons` array.
 * Empty while infrastructure-only (no productionActivated jobs).
 */
export function toVercelJsonCrons(entries: VercelCronEntry[]): Array<{
  path: string;
  schedule: string;
}> {
  return entries.map(({ path, schedule }) => ({ path, schedule }));
}
