-- Prevent authenticated clients from inserting extra public.stores rows via
-- PostgREST (stores_limit bypass). Store writes go through the service-role
-- app path (ensureWorkspaceStore) which enforces plan stores_limit.
-- Members retain SELECT; workspace isolation via is_workspace_member is unchanged.

drop policy if exists "Members can write stores" on public.stores;

revoke insert, update, delete on public.stores from anon, authenticated;
grant select on public.stores to authenticated;
grant all on public.stores to service_role;
