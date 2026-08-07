-- Supabase's default privileges auto-grant EXECUTE on newly created public
-- schema functions to anon/authenticated, independent of the PUBLIC
-- pseudo-role. Revoking from PUBLIC alone (as the previous migration did)
-- does not remove those separate role grants, which would let any signed-in
-- (or anonymous) client call this quota-consuming RPC directly via
-- /rest/v1/rpc/try_consume_usage_quota with an arbitrary workspace_id,
-- bypassing the app's own workspace-ownership checks. Lock it down to
-- service_role only, matching the intent of the original migration.
revoke execute on function public.try_consume_usage_quota(
  uuid, text, integer, timestamptz, timestamptz, text, uuid
) from anon, authenticated;
