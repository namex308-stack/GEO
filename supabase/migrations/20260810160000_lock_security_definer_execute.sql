-- Harden SECURITY DEFINER privilege boundaries without changing app behavior.
--
-- Context:
-- Supabase default grants give anon/authenticated EXECUTE on new public
-- functions even when PUBLIC is revoked. Trigger-only helpers and internal
-- utilities must not be callable via /rest/v1/rpc/*.
--
-- RLS membership helpers (is_workspace_member / has_workspace_role) remain
-- executable by authenticated because SELECT policies depend on them.
-- can_write_audit is only needed for legacy client write policies that this
-- migration re-drops (service-role app writes already bypass RLS).

-- ---------------------------------------------------------------------------
-- 1) Re-assert: no authenticated client writes on pipeline/billing tables
--    (idempotent with 20260807190000_lock_sensitive_writes.sql)
-- ---------------------------------------------------------------------------
drop policy if exists "Members can write audit_pages" on public.audit_pages;
drop policy if exists "Members can write audit_scores" on public.audit_scores;
drop policy if exists "Members can write recommendations" on public.recommendations;
drop policy if exists "Members can write geo_signals" on public.geo_signals;
drop policy if exists "Members can write reports" on public.reports;
drop policy if exists "Members can write ai_generations" on public.ai_generations;
drop policy if exists "Members can write analysis_runs" on public.analysis_runs;
drop policy if exists "Members can write usage_events" on public.usage_events;
drop policy if exists "Members can insert audits" on public.audits;
drop policy if exists "Members can update audits" on public.audits;

-- ---------------------------------------------------------------------------
-- 2) Trigger-only / internal SECURITY DEFINER — no client RPC
-- ---------------------------------------------------------------------------
revoke all on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;
grant execute on function public.handle_new_user() to postgres, service_role;

revoke all on function public.profiles_protect_onboarding_completed_at() from public;
revoke execute on function public.profiles_protect_onboarding_completed_at() from anon, authenticated;
grant execute on function public.profiles_protect_onboarding_completed_at() to postgres, service_role;

revoke all on function public.workspaces_protect_plan_id() from public;
revoke execute on function public.workspaces_protect_plan_id() from anon, authenticated;
grant execute on function public.workspaces_protect_plan_id() to postgres, service_role;

revoke all on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
grant execute on function public.rls_auto_enable() to postgres, service_role;

-- ---------------------------------------------------------------------------
-- 3) can_write_audit — no longer used by client policies; service_role only
-- ---------------------------------------------------------------------------
revoke all on function public.can_write_audit(uuid) from public;
revoke execute on function public.can_write_audit(uuid) from anon, authenticated;
grant execute on function public.can_write_audit(uuid) to postgres, service_role;

-- Keep search_path pinned (already set; recreate is intentional hardening).
create or replace function public.can_write_audit(p_audit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.audits a
    where a.id = p_audit_id
      and public.has_workspace_role(a.workspace_id, array['owner', 'admin', 'member'])
  );
$$;

revoke all on function public.can_write_audit(uuid) from public;
revoke execute on function public.can_write_audit(uuid) from anon, authenticated;
grant execute on function public.can_write_audit(uuid) to postgres, service_role;

-- ---------------------------------------------------------------------------
-- 4) RLS membership helpers — authenticated + service_role only (not anon)
-- ---------------------------------------------------------------------------
revoke all on function public.is_workspace_member(uuid) from public;
revoke execute on function public.is_workspace_member(uuid) from anon;
grant execute on function public.is_workspace_member(uuid) to authenticated, postgres, service_role;

revoke all on function public.has_workspace_role(uuid, text[]) from public;
revoke execute on function public.has_workspace_role(uuid, text[]) from anon;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated, postgres, service_role;

-- Reaffirm pinned search_path on membership helpers.
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

revoke all on function public.is_workspace_member(uuid) from public;
revoke execute on function public.is_workspace_member(uuid) from anon;
grant execute on function public.is_workspace_member(uuid) to authenticated, postgres, service_role;

revoke all on function public.has_workspace_role(uuid, text[]) from public;
revoke execute on function public.has_workspace_role(uuid, text[]) from anon;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated, postgres, service_role;

-- ---------------------------------------------------------------------------
-- 5) Reaffirm quota RPC lockdown (service_role only)
-- ---------------------------------------------------------------------------
revoke execute on function public.try_consume_usage_quota(
  uuid, text, integer, timestamptz, timestamptz, text, uuid
) from anon, authenticated;
grant execute on function public.try_consume_usage_quota(
  uuid, text, integer, timestamptz, timestamptz, text, uuid
) to postgres, service_role;
