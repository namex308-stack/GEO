# Scheduled jobs readiness (TASK 6)

Classification of promised scheduled / recurring features against the live architecture.
No new product surfaces were invented; automation catalog stubs stay inactive.

## Auth

All `/api/cron/*` routes use `authorizeCronRequest` (`CRON_SECRET` Bearer or `?secret=`).
Production denies requests when `CRON_SECRET` is unset.

## Vercel schedules (`vercel.json`)

| Path | Schedule | Job |
|------|----------|-----|
| `/api/cron/weekly-report` | `0 6 * * 1` | Weekly AI Report |
| `/api/cron/competitor-monitor` | `0 7 * * *` | Competitor Changes |

`/api/cron/automation/[jobId]` exists but is **not** registered in `vercel.json` and is gated by `AUTOMATION_ENABLED` (default off). Catalog `productionActivated` is `false` for every job.

## Feature classification

### Weekly AI Report — Fully operational (scheduled)

- Route + Vercel cron → `runWeeklyReportJob`
- Workspace isolation via store/workspace rows; upsert unique on `(store_id, period_start)`
- 7-day due gate + skip regenerate when ready report already matches latest audit
- Email skipped when `email_sent_at` set; in-app notifications deduped by `weekly_report:{id}`
- Failures persist `status=failed` with `error_message`; job logs start/end counts

### Competitor Changes — Fully operational (scheduled)

- Route + Vercel cron → `runCompetitorMonitorJob`
- Sync + process gated by plan `competitor` entitlement; non-entitled due targets advance cadence and skip
- Snapshot/change inserts scoped by `workspace_id`; alerts emit into workspace alerts/notifications
- Crawl policy + failure snapshots; structured job start/end logging

### GEO Score Changes — Fully operational (event-driven)

- Not a cron. `recordGeoScoreHistory` runs on completed audit persist in `audit-repository`
- No scheduled sweep exists or was added

### Store Health Changes — Fully operational (on-read)

- Derived via `GET /api/store-health` / `getStoreHealthForUser` from latest audits
- Automation job `health_updates` remains stub / inactive (`not_implemented`, not in `vercel.json`)

### AI Alerts — Fully operational (event-driven)

- Emitted on audit complete and competitor change detection (`emitAlertsForCompletedAudit` / `emitAlertsForCompetitorChanges`)
- Automation job `ai_alerts` remains stub / inactive (no separate delivery sweep productized)

### Growth Tasks — Fully operational (event-driven)

- `syncGrowthTasksFromAudit` on completed audit persist
- No dedicated cron; not part of `vercel.json`

## Intentionally inactive

| Catalog id | Status | Reason |
|------------|--------|--------|
| `weekly_scan` | Stub/inactive | No domain runner; would invent scheduled re-audits |
| `monthly_scan` | Stub/inactive | Same |
| `health_updates` | Stub/inactive | Health is on-read; no persisted refresh pipeline |
| `ai_alerts` | Stub/inactive | Alerts already emitted at source |
| `weekly_reports` / `competitor_monitoring` | Handler wired, inactive | Wrappers exist but catalog not production-activated; live path is dedicated Vercel crons |
