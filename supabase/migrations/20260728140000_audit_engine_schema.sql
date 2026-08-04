-- ConvAudit production schema (workspace-first audit engine)
-- Supersedes prior user-scoped profiles/subscriptions draft.
-- No watch_* tables. No competitors table. No usage_periods (meter via usage_events).

-- =============================================================================
-- 1. Plan catalog
-- =============================================================================
create table if not exists public.plan_catalog (
  id text primary key check (id in ('free', 'pro', 'business')),
  display_name text not null,
  audits_per_month integer,
  ai_gens_per_month integer,
  stores_limit integer,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.plan_catalog (id, display_name, audits_per_month, ai_gens_per_month, stores_limit, features)
values
  ('free', 'Free', 3, 0, 1, '{"competitor": false, "ai_generator": false}'::jsonb),
  ('pro', 'Pro', 30, 100, 3, '{"competitor": true, "ai_generator": true}'::jsonb),
  ('business', 'Business', null, null, null, '{"competitor": true, "ai_generator": true, "api": true}'::jsonb)
on conflict (id) do nothing;

-- =============================================================================
-- 2. Profiles
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  locale text default 'en',
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- 3. Workspaces + members
-- =============================================================================
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  plan_id text not null default 'free' references public.plan_catalog (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists workspaces_slug_uidx
  on public.workspaces (slug) where slug is not null;

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members (user_id);

-- =============================================================================
-- 4. Subscriptions + billing events
-- =============================================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  plan_id text not null references public.plan_catalog (id),
  status text not null default 'active'
    check (status in ('active', 'canceled', 'past_due', 'trialing')),
  billing_period text check (billing_period in ('monthly', 'yearly')),
  kashier_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_kashier_order_uidx
  on public.subscriptions (kashier_subscription_id)
  where kashier_subscription_id is not null;

create index if not exists subscriptions_workspace_status_idx
  on public.subscriptions (workspace_id, status);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete set null,
  provider text not null default 'kashier',
  event_type text not null,
  external_id text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists billing_events_provider_external_uidx
  on public.billing_events (provider, external_id, event_type)
  where external_id is not null;

-- =============================================================================
-- 5. Stores
-- =============================================================================
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  primary_url text not null,
  platform text default 'unknown',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, primary_url)
);

create index if not exists stores_workspace_created_idx
  on public.stores (workspace_id, created_at desc);

-- =============================================================================
-- 6. Analysis categories (replaces hardcoded pillar-only assumptions)
-- =============================================================================
create table if not exists public.analysis_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  description text,
  created_at timestamptz not null default now()
);

insert into public.analysis_categories (slug, display_name, description)
values
  ('conversion', 'Conversion', 'Purchase friction, offers, and persuasion'),
  ('seo', 'SEO', 'Discoverability in traditional search'),
  ('geo', 'GEO / AI Visibility', 'Visibility in AI answer engines'),
  ('trust', 'Trust', 'Buyer confidence and policy signals')
on conflict (slug) do nothing;

-- =============================================================================
-- 7. Audits + pages + scores + recommendations + geo + reports
-- =============================================================================
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  store_id uuid references public.stores (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  status text not null default 'queued'
    check (status in ('queued', 'scraping', 'analyzing', 'completed', 'failed')),
  product_url text not null,
  store_url text,
  competitor_url text,
  product_name text,
  store_name text,
  overall_score integer,
  competitor_score integer,
  error_message text,
  model text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists audits_workspace_created_idx
  on public.audits (workspace_id, created_at desc);

create index if not exists audits_workspace_status_idx
  on public.audits (workspace_id, status);

create index if not exists audits_store_created_idx
  on public.audits (store_id, created_at desc);

create table if not exists public.audit_pages (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  role text not null check (role in ('primary', 'competitor')),
  url text not null,
  page_type text not null default 'unknown'
    check (page_type in (
      'homepage', 'product', 'collection', 'faq', 'contact',
      'policy', 'blog', 'unknown'
    )),
  title text,
  description text,
  image_count integer default 0,
  scrape_status text not null default 'pending'
    check (scrape_status in ('pending', 'ok', 'failed')),
  scrape_ms integer,
  content_hash text,
  structured_data jsonb not null default '{}'::jsonb,
  -- Normalized markdown excerpt only — never persist raw HTML long-term
  normalized_markdown text,
  created_at timestamptz not null default now(),
  unique (audit_id, role)
);

create index if not exists audit_pages_content_hash_idx
  on public.audit_pages (content_hash)
  where content_hash is not null;

create table if not exists public.audit_scores (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  category_id uuid not null references public.analysis_categories (id),
  subject text not null default 'self' check (subject in ('self', 'competitor')),
  score integer not null,
  max_score integer not null default 100,
  label text,
  summary text,
  unique (audit_id, category_id, subject)
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  category_id uuid references public.analysis_categories (id),
  external_key text,
  pillar text,
  severity text not null check (severity in ('critical', 'warning', 'opportunity')),
  impact text not null check (impact in ('high', 'medium', 'low')),
  effort text check (effort in ('quick', 'medium', 'involved')),
  problem text not null,
  solution text not null,
  confidence integer,
  affected_page text,
  projected_impact text,
  before_preview text,
  after_preview text,
  estimated_lift text,
  source text not null default 'gemini'
    check (source in ('firecrawl', 'gemini', 'rule_engine')),
  fix_type text not null default 'manual'
    check (fix_type in ('manual', 'generated', 'automatic')),
  sort_order integer not null default 0,
  status text not null default 'open'
    check (status in ('open', 'done', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists recommendations_audit_sort_idx
  on public.recommendations (audit_id, sort_order);

create table if not exists public.geo_signals (
  audit_id uuid primary key references public.audits (id) on delete cascade,
  chatgpt integer,
  perplexity integer,
  google_ai integer
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  version integer not null default 1,
  summary jsonb not null default '{}'::jsonb,
  rendered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (audit_id, version)
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  audit_id uuid references public.audits (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  product_url text,
  payload jsonb not null default '{}'::jsonb,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists ai_generations_workspace_created_idx
  on public.ai_generations (workspace_id, created_at desc);

-- =============================================================================
-- 8. Analysis runs (per-analyzer tracking)
-- =============================================================================
create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  analyzer text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  tokens_used integer,
  estimated_cost numeric(12, 6),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists analysis_runs_audit_idx
  on public.analysis_runs (audit_id, created_at);

-- =============================================================================
-- 9. Usage events (no usage_periods — period derived from subscription dates)
-- =============================================================================
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  metric text not null
    check (metric in ('audit', 'ai_generation', 'competitor_compare', 'api_call')),
  quantity integer not null default 1,
  ref_type text,
  ref_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_workspace_metric_created_idx
  on public.usage_events (workspace_id, metric, created_at desc);

-- =============================================================================
-- 10. Signup: profile + personal workspace
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.workspaces (name, plan_id)
  values ('Personal', 'free')
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper for RLS
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(ws uuid, roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws
      and m.user_id = auth.uid()
      and m.role = any (roles)
  );
$$;

-- =============================================================================
-- 11. RLS
-- =============================================================================
alter table public.plan_catalog enable row level security;
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;
alter table public.stores enable row level security;
alter table public.analysis_categories enable row level security;
alter table public.audits enable row level security;
alter table public.audit_pages enable row level security;
alter table public.audit_scores enable row level security;
alter table public.recommendations enable row level security;
alter table public.geo_signals enable row level security;
alter table public.reports enable row level security;
alter table public.ai_generations enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.usage_events enable row level security;

-- plan_catalog / analysis_categories: readable by authenticated
drop policy if exists "Anyone authenticated can read plans" on public.plan_catalog;
create policy "Anyone authenticated can read plans"
  on public.plan_catalog for select to authenticated using (true);

drop policy if exists "Anyone authenticated can read categories" on public.analysis_categories;
create policy "Anyone authenticated can read categories"
  on public.analysis_categories for select to authenticated using (true);

-- profiles
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- workspaces
drop policy if exists "Members can read workspaces" on public.workspaces;
create policy "Members can read workspaces"
  on public.workspaces for select using (public.is_workspace_member(id));

drop policy if exists "Owners admins can update workspaces" on public.workspaces;
create policy "Owners admins can update workspaces"
  on public.workspaces for update
  using (public.has_workspace_role(id, array['owner', 'admin']))
  with check (public.has_workspace_role(id, array['owner', 'admin']));

-- workspace_members
drop policy if exists "Members can read memberships" on public.workspace_members;
create policy "Members can read memberships"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

-- subscriptions (read by members; writes via service role)
drop policy if exists "Members can read subscriptions" on public.subscriptions;
create policy "Members can read subscriptions"
  on public.subscriptions for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Owners can read billing events" on public.billing_events;
create policy "Owners can read billing events"
  on public.billing_events for select
  using (workspace_id is not null and public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- stores / audits / children
drop policy if exists "Members can read stores" on public.stores;
create policy "Members can read stores"
  on public.stores for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can write stores" on public.stores;
create policy "Members can write stores"
  on public.stores for all
  using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']))
  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));

drop policy if exists "Members can read audits" on public.audits;
create policy "Members can read audits"
  on public.audits for select using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert audits" on public.audits;
create policy "Members can insert audits"
  on public.audits for insert
  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));

drop policy if exists "Members can update audits" on public.audits;
create policy "Members can update audits"
  on public.audits for update
  using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));

-- Child tables: access via parent audit membership
drop policy if exists "Members can read audit_pages" on public.audit_pages;
create policy "Members can read audit_pages"
  on public.audit_pages for select
  using (exists (
    select 1 from public.audits a
    where a.id = audit_id and public.is_workspace_member(a.workspace_id)
  ));

drop policy if exists "Members can read audit_scores" on public.audit_scores;
create policy "Members can read audit_scores"
  on public.audit_scores for select
  using (exists (
    select 1 from public.audits a
    where a.id = audit_id and public.is_workspace_member(a.workspace_id)
  ));

drop policy if exists "Members can read recommendations" on public.recommendations;
create policy "Members can read recommendations"
  on public.recommendations for select
  using (exists (
    select 1 from public.audits a
    where a.id = audit_id and public.is_workspace_member(a.workspace_id)
  ));

drop policy if exists "Members can read geo_signals" on public.geo_signals;
create policy "Members can read geo_signals"
  on public.geo_signals for select
  using (exists (
    select 1 from public.audits a
    where a.id = audit_id and public.is_workspace_member(a.workspace_id)
  ));

drop policy if exists "Members can read reports" on public.reports;
create policy "Members can read reports"
  on public.reports for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can read ai_generations" on public.ai_generations;
create policy "Members can read ai_generations"
  on public.ai_generations for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can read analysis_runs" on public.analysis_runs;
create policy "Members can read analysis_runs"
  on public.analysis_runs for select
  using (exists (
    select 1 from public.audits a
    where a.id = audit_id and public.is_workspace_member(a.workspace_id)
  ));

drop policy if exists "Members can read usage_events" on public.usage_events;
create policy "Members can read usage_events"
  on public.usage_events for select
  using (public.is_workspace_member(workspace_id));
