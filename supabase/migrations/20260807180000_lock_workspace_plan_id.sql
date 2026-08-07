-- Prevent client privilege escalation: owners/admins must not be able to
-- UPDATE workspaces.plan_id via the anon/authenticated PostgREST path.
-- Billing activation uses the service_role key and remains allowed.
--
-- RLS alone cannot express "column immutable for this role" cleanly on UPDATE,
-- so enforce with a BEFORE UPDATE trigger that blocks authenticated/anon only.

create or replace function public.workspaces_protect_plan_id()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.plan_id is distinct from old.plan_id
     and coalesce(auth.role(), '') in ('authenticated', 'anon') then
    raise exception 'workspaces.plan_id is not client-updatable'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists workspaces_protect_plan_id on public.workspaces;
create trigger workspaces_protect_plan_id
  before update on public.workspaces
  for each row
  execute function public.workspaces_protect_plan_id();

revoke all on function public.workspaces_protect_plan_id() from public;
grant execute on function public.workspaces_protect_plan_id() to postgres, service_role;
