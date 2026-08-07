-- Notification Center: unified in-app inbox (alerts, reports, competitor, scores, tasks, billing).
-- Writes are service-role only. Members can SELECT. Read/archive updates via service-role API.
-- Push notifications are intentionally not implemented.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  store_id uuid references public.stores (id) on delete set null,
  category text not null check (category in (
    'ai_alert',
    'weekly_report',
    'competitor_change',
    'score_change',
    'completed_task',
    'subscription_warning'
  )),
  priority text not null default 'medium'
    check (priority in ('critical', 'high', 'medium', 'low')),
  title text not null,
  body text not null,
  action_label text,
  action_href text,
  source text not null default 'system'
    check (source in ('audit', 'competitor', 'geo', 'report', 'task', 'billing', 'system')),
  source_ref_type text,
  source_ref_id text,
  dedupe_key text not null,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz,
  is_archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, dedupe_key)
);

create index if not exists notifications_workspace_created_idx
  on public.notifications (workspace_id, created_at desc)
  where is_archived = false;

create index if not exists notifications_workspace_unread_idx
  on public.notifications (workspace_id, is_read, created_at desc)
  where is_read = false and is_archived = false;

create index if not exists notifications_workspace_category_idx
  on public.notifications (workspace_id, category, created_at desc)
  where is_archived = false;

alter table public.notifications enable row level security;

drop policy if exists "Members can read notifications" on public.notifications;
create policy "Members can read notifications"
  on public.notifications for select
  using (public.is_workspace_member(workspace_id));

revoke insert, update, delete on public.notifications from authenticated;
grant select on public.notifications to authenticated;
grant all on public.notifications to service_role;
