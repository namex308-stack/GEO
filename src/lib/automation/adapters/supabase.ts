import { listAutomationJobDefinitions } from "../catalog";
import type { AutomationJobId, SupabaseCronSpec } from "../types";
import { getAutomationJobDefinition } from "../catalog";

function escapeLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Build inactive pg_cron specs that invoke the app's HTTP automation route
 * via pg_net (or equivalent). SQL is returned as strings only — never applied.
 */
export function buildSupabaseCronSpecs(options?: {
  includeInactive?: boolean;
  /** Placeholder origin used inside example SQL. */
  appOrigin?: string;
  cronSecretEnvRef?: string;
}): SupabaseCronSpec[] {
  const includeInactive = options?.includeInactive === true;
  const origin = (options?.appOrigin ?? "https://YOUR_APP_ORIGIN").replace(
    /\/$/,
    ""
  );
  const secretRef = options?.cronSecretEnvRef ?? "CRON_SECRET";

  return listAutomationJobDefinitions()
    .filter((job) => job.adapters.includes("supabase"))
    .filter((job) => includeInactive || job.productionActivated)
    .map((job) => {
      const url = `${origin}${job.httpPath}`;
      const cronName = `automation_${job.id}`;
      const exampleSql = [
        `-- INACTIVE TEMPLATE — do not apply until automation is intentionally activated.`,
        `-- Job: ${job.name} (${job.id})`,
        `-- Requires: pg_cron + pg_net (or an Edge Function proxy).`,
        `select cron.schedule(`,
        `  '${escapeLiteral(cronName)}',`,
        `  '${escapeLiteral(job.schedule)}',`,
        `  $$`,
        `  select net.http_post(`,
        `    url := '${escapeLiteral(url)}',`,
        `    headers := jsonb_build_object(`,
        `      'Content-Type', 'application/json',`,
        `      'Authorization', 'Bearer ' || current_setting('app.settings.${escapeLiteral(secretRef)}', true)`,
        `    ),`,
        `    body := '{}'::jsonb`,
        `  );`,
        `  $$`,
        `);`,
      ].join("\n");

      return {
        jobId: job.id,
        cronName,
        schedule: job.schedule,
        httpPath: job.httpPath,
        exampleSql,
      };
    });
}

export function getSupabaseCronSpec(
  jobId: AutomationJobId,
  options?: { appOrigin?: string }
): SupabaseCronSpec {
  const def = getAutomationJobDefinition(jobId);
  const [spec] = buildSupabaseCronSpecs({
    includeInactive: true,
    appOrigin: options?.appOrigin,
  }).filter((s) => s.jobId === def.id);
  if (!spec) {
    throw new Error(`No Supabase cron spec for job ${jobId}`);
  }
  return spec;
}
