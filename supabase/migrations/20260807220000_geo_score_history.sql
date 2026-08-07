-- GEO Score historical tracking (one row per completed audit).
-- Does not alter the GEO engine — only persists scores already produced.
-- Writes are service-role only; members can SELECT.

create table if not exists public.geo_score_history (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  store_id uuid references public.stores (id) on delete set null,
  audit_id uuid not null references public.audits (id) on delete cascade,
  overall_geo_score numeric not null,
  citation_score numeric,
  schema_score numeric,
  entity_score numeric,
  faq_score numeric,
  ai_readability numeric,
  findings jsonb not null default '[]'::jsonb,
  component_scores jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (audit_id)
);

create index if not exists geo_score_history_workspace_recorded_idx
  on public.geo_score_history (workspace_id, recorded_at desc);

create index if not exists geo_score_history_store_recorded_idx
  on public.geo_score_history (store_id, recorded_at desc)
  where store_id is not null;

alter table public.geo_score_history enable row level security;

drop policy if exists "Members can read geo_score_history" on public.geo_score_history;
create policy "Members can read geo_score_history"
  on public.geo_score_history for select
  using (public.is_workspace_member(workspace_id));

revoke insert, update, delete on public.geo_score_history from authenticated;
grant select on public.geo_score_history to authenticated;
grant all on public.geo_score_history to service_role;
