-- Weekly AI Report: one automated delta report per active store every 7 days.
-- Writes are service-role only (matches audit pipeline lockdown). Members can SELECT.

create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  latest_audit_id uuid references public.audits (id) on delete set null,
  previous_audit_id uuid references public.audits (id) on delete set null,
  status text not null default 'ready'
    check (status in ('pending', 'ready', 'failed', 'skipped')),
  payload jsonb not null default '{}'::jsonb,
  email_html text,
  email_sent_at timestamptz,
  error_message text,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- One report row per store per period start (cron uses week-aligned starts).
  unique (store_id, period_start)
);

create index if not exists weekly_reports_workspace_generated_idx
  on public.weekly_reports (workspace_id, generated_at desc);

create index if not exists weekly_reports_store_generated_idx
  on public.weekly_reports (store_id, generated_at desc);

alter table public.weekly_reports enable row level security;

drop policy if exists "Members can read weekly_reports" on public.weekly_reports;
create policy "Members can read weekly_reports"
  on public.weekly_reports for select
  using (public.is_workspace_member(workspace_id));

-- No authenticated INSERT/UPDATE/DELETE — service role only.
revoke insert, update, delete on public.weekly_reports from authenticated;
grant select on public.weekly_reports to authenticated;
grant all on public.weekly_reports to service_role;
