-- Competitor Change Monitoring: targets, snapshots, and change history.
-- Writes are service-role only. Members can SELECT within their workspace.

-- =============================================================================
-- competitor_targets — URLs to watch (workspace-scoped)
-- =============================================================================
create table if not exists public.competitor_targets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  store_id uuid references public.stores (id) on delete set null,
  label text,
  url text not null,
  page_type text not null default 'unknown',
  is_active boolean not null default true,
  cadence_hours integer not null default 24
    check (cadence_hours >= 1 and cadence_hours <= 720),
  last_checked_at timestamptz,
  last_changed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, url)
);

create index if not exists competitor_targets_workspace_active_idx
  on public.competitor_targets (workspace_id, is_active, last_checked_at);

-- =============================================================================
-- competitor_snapshots — point-in-time crawl + scores
-- =============================================================================
create table if not exists public.competitor_snapshots (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.competitor_targets (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  scraped_at timestamptz not null default now(),
  scrape_source text not null default 'none'
    check (scrape_source in ('firecrawl', 'fallback', 'audit_reuse', 'none')),
  scrape_status text not null default 'ok'
    check (scrape_status in ('ok', 'failed')),
  content_hash text,
  title text,
  description text,
  price text,
  rating text,
  review_count text,
  faq_count integer not null default 0,
  schema_types text[] not null default '{}',
  overall_score integer,
  conversion_score integer,
  seo_score integer,
  geo_score integer,
  trust_score integer,
  signals jsonb not null default '{}'::jsonb,
  page_payload jsonb not null default '{}'::jsonb,
  scores_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists competitor_snapshots_target_scraped_idx
  on public.competitor_snapshots (target_id, scraped_at desc);

create index if not exists competitor_snapshots_workspace_scraped_idx
  on public.competitor_snapshots (workspace_id, scraped_at desc);

-- =============================================================================
-- competitor_changes — detected deltas between consecutive snapshots
-- =============================================================================
create table if not exists public.competitor_changes (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.competitor_targets (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  previous_snapshot_id uuid references public.competitor_snapshots (id) on delete set null,
  current_snapshot_id uuid not null references public.competitor_snapshots (id) on delete cascade,
  change_type text not null check (change_type in (
    'price_increase',
    'price_drop',
    'content_change',
    'title_change',
    'description_change',
    'new_faq',
    'removed_faq',
    'new_reviews',
    'removed_reviews',
    'schema_change',
    'trust_change',
    'seo_change',
    'ai_visibility_change'
  )),
  severity text not null default 'info'
    check (severity in ('critical', 'warning', 'info')),
  field_path text,
  previous_value jsonb,
  current_value jsonb,
  summary text not null,
  business_impact text,
  recommended_action text,
  payload jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists competitor_changes_target_detected_idx
  on public.competitor_changes (target_id, detected_at desc);

create index if not exists competitor_changes_workspace_detected_idx
  on public.competitor_changes (workspace_id, detected_at desc);

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.competitor_targets enable row level security;
alter table public.competitor_snapshots enable row level security;
alter table public.competitor_changes enable row level security;

drop policy if exists "Members can read competitor_targets" on public.competitor_targets;
create policy "Members can read competitor_targets"
  on public.competitor_targets for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can read competitor_snapshots" on public.competitor_snapshots;
create policy "Members can read competitor_snapshots"
  on public.competitor_snapshots for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can read competitor_changes" on public.competitor_changes;
create policy "Members can read competitor_changes"
  on public.competitor_changes for select
  using (public.is_workspace_member(workspace_id));

revoke insert, update, delete on public.competitor_targets from authenticated;
revoke insert, update, delete on public.competitor_snapshots from authenticated;
revoke insert, update, delete on public.competitor_changes from authenticated;

grant select on public.competitor_targets to authenticated;
grant select on public.competitor_snapshots to authenticated;
grant select on public.competitor_changes to authenticated;

grant all on public.competitor_targets to service_role;
grant all on public.competitor_snapshots to service_role;
grant all on public.competitor_changes to service_role;
