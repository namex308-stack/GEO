-- Prevent clients from forging onboarding completion or writing billing-critical
-- audit/usage rows via PostgREST. App APIs use the service role (bypasses RLS).

-- ---------------------------------------------------------------------------
-- profiles.onboarding_completed_at — service_role only
-- ---------------------------------------------------------------------------
create or replace function public.profiles_protect_onboarding_completed_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.onboarding_completed_at is distinct from old.onboarding_completed_at
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'profiles.onboarding_completed_at is not client-updatable';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_onboarding_completed_at on public.profiles;
create trigger profiles_protect_onboarding_completed_at
  before update on public.profiles
  for each row
  execute function public.profiles_protect_onboarding_completed_at();

revoke all on function public.profiles_protect_onboarding_completed_at() from public;
grant execute on function public.profiles_protect_onboarding_completed_at() to postgres, service_role;

-- ---------------------------------------------------------------------------
-- Drop authenticated write policies on quota / audit pipeline tables
-- (service role continues to write; members retain SELECT where defined)
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
