-- Atomic, race-safe monthly usage quota enforcement (Task 7.1).
-- Two concurrent requests for the same workspace + metric must never both
-- observe "usage < limit" and both be allowed through when only one slot
-- remains. `pg_advisory_xact_lock` serializes callers on the same
-- workspace+metric key; the lock is released automatically at transaction end.
--
-- Called only via the service-role admin client from server-side API routes
-- (see src/lib/db/audit-repository.ts::tryConsumeUsageQuota). Workspace
-- ownership is enforced upstream — workspace_id is always derived server-side
-- from the authenticated user via ensurePersonalWorkspace(), the same
-- invariant every other admin-client write in this codebase relies on. This
-- function intentionally does not depend on auth.uid()/has_workspace_role,
-- since service-role requests carry no user JWT context.

create or replace function public.try_consume_usage_quota(
  p_workspace_id uuid,
  p_metric text,
  p_limit integer,          -- null = unlimited (e.g. Business plan)
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_ref_type text default null,
  p_ref_id uuid default null
)
returns table (allowed boolean, used_count integer, usage_event_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_event_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text || ':' || p_metric, 0));

  select count(*) into v_count
  from public.usage_events
  where workspace_id = p_workspace_id
    and metric = p_metric
    and created_at >= p_period_start
    and created_at <= p_period_end;

  if p_limit is not null and v_count >= p_limit then
    return query select false, v_count, null::uuid;
    return;
  end if;

  insert into public.usage_events (workspace_id, metric, quantity, ref_type, ref_id)
  values (p_workspace_id, p_metric, 1, p_ref_type, p_ref_id)
  returning id into v_event_id;

  return query select true, v_count + 1, v_event_id;
end;
$$;

-- Server-only entry point: only the service role (the API's admin client) may
-- call this. Regular authenticated/anon roles keep going through existing
-- RLS-guarded table policies for any direct access.
revoke all on function public.try_consume_usage_quota(
  uuid, text, integer, timestamptz, timestamptz, text, uuid
) from public;
grant execute on function public.try_consume_usage_quota(
  uuid, text, integer, timestamptz, timestamptz, text, uuid
) to service_role;
