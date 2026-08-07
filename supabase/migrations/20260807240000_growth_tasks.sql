-- Growth Tasks Engine: durable actionable tasks derived from recommendations.
-- Writes are service-role only. Members can SELECT. Status updates via service role API.

create table if not exists public.growth_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  store_id uuid references public.stores (id) on delete set null,
  fingerprint text not null,
  external_key text,
  title text not null,
  category text not null
    check (category in ('conversion', 'seo', 'geo', 'trust')),
  priority text not null default 'p2'
    check (priority in ('p1', 'p2', 'p3')),
  difficulty text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard')),
  estimated_time text not null,
  expected_business_impact text not null,
  horizon text not null
    check (horizon in ('today', 'week', 'month', 'longterm')),
  suggested_order integer not null default 0,
  status text not null default 'open'
    check (status in ('open', 'done', 'auto_resolved')),
  completed_at timestamptz,
  completion_source text
    check (completion_source is null or completion_source in ('user', 'reanalysis')),
  source_audit_id uuid references public.audits (id) on delete set null,
  resolved_audit_id uuid references public.audits (id) on delete set null,
  recommendation_problem text,
  recommendation_solution text,
  severity text
    check (severity is null or severity in ('critical', 'warning', 'opportunity')),
  impact text
    check (impact is null or impact in ('high', 'medium', 'low')),
  effort text
    check (effort is null or effort in ('quick', 'medium', 'involved')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, fingerprint)
);

create index if not exists growth_tasks_workspace_horizon_order_idx
  on public.growth_tasks (workspace_id, horizon, suggested_order);

create index if not exists growth_tasks_workspace_status_idx
  on public.growth_tasks (workspace_id, status, suggested_order);

create index if not exists growth_tasks_store_status_idx
  on public.growth_tasks (store_id, status)
  where store_id is not null;

alter table public.growth_tasks enable row level security;

drop policy if exists "Members can read growth_tasks" on public.growth_tasks;
create policy "Members can read growth_tasks"
  on public.growth_tasks for select
  using (public.is_workspace_member(workspace_id));

revoke insert, update, delete on public.growth_tasks from authenticated;
grant select on public.growth_tasks to authenticated;
grant all on public.growth_tasks to service_role;
