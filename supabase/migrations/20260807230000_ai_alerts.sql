-- AI Alerts: workspace inbox for score, trust, schema, competitor, and health events.
-- Writes are service-role only. Members can SELECT. Read-state updates go through service role.

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  store_id uuid references public.stores (id) on delete set null,
  alert_type text not null check (alert_type in (
    'overall_score_drop',
    'geo_score_drop',
    'trust_signals_lost',
    'schema_invalid',
    'competitor_improved',
    'competitor_price_drop',
    'important_recommendation',
    'store_healthier'
  )),
  priority text not null default 'medium'
    check (priority in ('critical', 'high', 'medium', 'low')),
  title text not null,
  reason text not null,
  business_impact text not null,
  suggested_action text not null,
  source text not null default 'system'
    check (source in ('audit', 'competitor', 'geo', 'system')),
  source_ref_type text,
  source_ref_id text,
  dedupe_key text not null,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  -- Future notification channels (email delivery not implemented yet).
  notify_in_app boolean not null default true,
  notify_email boolean not null default false,
  in_app_delivered_at timestamptz,
  email_delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, dedupe_key)
);

create index if not exists alerts_workspace_created_idx
  on public.alerts (workspace_id, created_at desc);

create index if not exists alerts_workspace_unread_idx
  on public.alerts (workspace_id, is_read, created_at desc)
  where is_read = false;

create index if not exists alerts_store_created_idx
  on public.alerts (store_id, created_at desc)
  where store_id is not null;

alter table public.alerts enable row level security;

drop policy if exists "Members can read alerts" on public.alerts;
create policy "Members can read alerts"
  on public.alerts for select
  using (public.is_workspace_member(workspace_id));

revoke insert, update, delete on public.alerts from authenticated;
grant select on public.alerts to authenticated;
grant all on public.alerts to service_role;
