-- Child-table write policies aligned with audits membership model.
-- Service-role API writes still work; authenticated member clients can also write via RLS.

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
grant execute on function public.can_write_audit(uuid) to authenticated;

-- audit_pages
drop policy if exists "Members can write audit_pages" on public.audit_pages;
create policy "Members can write audit_pages"
  on public.audit_pages for all
  using (public.can_write_audit(audit_id))
  with check (public.can_write_audit(audit_id));

-- audit_scores
drop policy if exists "Members can write audit_scores" on public.audit_scores;
create policy "Members can write audit_scores"
  on public.audit_scores for all
  using (public.can_write_audit(audit_id))
  with check (public.can_write_audit(audit_id));

-- recommendations
drop policy if exists "Members can write recommendations" on public.recommendations;
create policy "Members can write recommendations"
  on public.recommendations for all
  using (public.can_write_audit(audit_id))
  with check (public.can_write_audit(audit_id));

-- geo_signals
drop policy if exists "Members can write geo_signals" on public.geo_signals;
create policy "Members can write geo_signals"
  on public.geo_signals for all
  using (public.can_write_audit(audit_id))
  with check (public.can_write_audit(audit_id));

-- reports
drop policy if exists "Members can write reports" on public.reports;
create policy "Members can write reports"
  on public.reports for all
  using (public.is_workspace_member(workspace_id) and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']))
  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));

-- ai_generations
drop policy if exists "Members can write ai_generations" on public.ai_generations;
create policy "Members can write ai_generations"
  on public.ai_generations for all
  using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']))
  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));

-- analysis_runs
drop policy if exists "Members can write analysis_runs" on public.analysis_runs;
create policy "Members can write analysis_runs"
  on public.analysis_runs for all
  using (public.can_write_audit(audit_id))
  with check (public.can_write_audit(audit_id));

-- usage_events
drop policy if exists "Members can write usage_events" on public.usage_events;
create policy "Members can write usage_events"
  on public.usage_events for insert
  with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']));
